package com.ev.common.mybatis.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor;
import com.ev.common.mybatis.handler.DataPermissionInterceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.ContextRefreshedEvent;

import java.util.List;

/**
 * MyBatis-Plus 配置
 */
@Configuration
public class MybatisPlusConfig implements ApplicationListener<ContextRefreshedEvent> {

    @Lazy
    @Autowired
    private List<SqlSessionFactory> sqlSessionFactoryList;

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 租户隔离插件（必须在分页之前）
        interceptor.addInnerInterceptor(new TenantLineInnerInterceptor(new EvTenantLineHandler()));
        // 分页插件
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.POSTGRE_SQL);
        paginationInterceptor.setMaxLimit(500L);
        interceptor.addInnerInterceptor(paginationInterceptor);
        // 乐观锁插件
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }

    /**
     * 注册数据权限拦截器
     * 使用 ContextRefreshedEvent 延迟到整个 Spring 上下文初始化完成后再添加，
     * 避免 @PostConstruct 在 SqlSessionFactory 创建阶段强制解析 lazy proxy 导致循环依赖。
     */
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        DataPermissionInterceptor interceptor = new DataPermissionInterceptor();
        for (SqlSessionFactory sqlSessionFactory : sqlSessionFactoryList) {
            sqlSessionFactory.getConfiguration().addInterceptor(interceptor);
        }
    }
}
