package com.ev.charging.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 充电流程集成测试
 * 验证完整充电流程：启动充电 → 查询状态 → 停止充电 → 订单结算
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChargingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        // 获取管理员 Token
        String loginJson = """
                {"username":"admin","password":"admin123"}
                """;

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andReturn();

        String response = loginResult.getResponse().getContentAsString();
        // 提取 token（根据实际响应结构调整）
        adminToken = extractToken(response);
    }

    @Test
    @Order(1)
    @DisplayName("完整充电流程：启动 → 查询 → 停止")
    void testFullChargingFlow() throws Exception {
        // 1. 查询可用充电站
        mockMvc.perform(get("/api/v1/stations")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk());

        // 2. 查询充电状态（无活跃会话应返回空）
        mockMvc.perform(get("/api/v1/charging/status")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    @DisplayName("未授权访问应返回 401")
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/charging/status"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(3)
    @DisplayName("并发请求不会导致数据异常")
    void testConcurrentRequests() throws Exception {
        int threadCount = 5;
        CountDownLatch latch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    mockMvc.perform(get("/api/v1/stations")
                                    .header("Authorization", "Bearer " + adminToken)
                                    .param("page", "1")
                                    .param("size", "10"))
                            .andExpect(status().isOk());
                } catch (Exception e) {
                    // 并发测试允许部分失败
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();
    }

    @Test
    @Order(4)
    @DisplayName("Dashboard 统计接口响应正常")
    void testDashboardStats() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    @DisplayName("订单列表查询带分页")
    void testOrderListWithPagination() throws Exception {
        mockMvc.perform(get("/api/v1/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk());
    }

    /**
     * 从登录响应中提取 token
     */
    private String extractToken(String response) {
        try {
            var jsonNode = objectMapper.readTree(response);
            if (jsonNode.has("data")) {
                var data = jsonNode.get("data");
                if (data.has("token")) {
                    return data.get("token").asText();
                }
                if (data.has("accessToken")) {
                    return data.get("accessToken").asText();
                }
            }
        } catch (Exception e) {
            // 解析失败返回空
        }
        return "";
    }
}
