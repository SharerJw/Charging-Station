package com.ev.common.minio.config;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * MinIO 文件存储服务
 */
@Slf4j
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    /**
     * 上传文件
     *
     * @param file 文件
     * @param directory 目录（如：avatars, qrcodes, refunds）
     * @return 文件访问URL
     */
    public String uploadFile(MultipartFile file, String directory) {
        try {
            // 确保存储桶存在
            createBucketIfNotExists();

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String ext = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".png";
            String filename = UUID.randomUUID().toString().replace("-", "") + ext;

            // 构建对象名
            String objectName = directory + "/" + filename;

            // 上传文件
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            // 生成访问URL
            String url = getObjectUrl(objectName);

            log.info("文件上传成功: objectName={}, url={}", objectName, url);
            return url;

        } catch (Exception e) {
            log.error("文件上传失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传文件（InputStream）
     *
     * @param inputStream 输入流
     * @param objectName 对象名称
     * @param contentType 内容类型
     * @return 文件访问URL
     */
    public String uploadFile(InputStream inputStream, String objectName, String contentType) {
        try {
            createBucketIfNotExists();

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .stream(inputStream, -1, 10485760) // 10MB
                            .contentType(contentType)
                            .build()
            );

            String url = getObjectUrl(objectName);
            log.info("文件上传成功: objectName={}, url={}", objectName, url);
            return url;

        } catch (Exception e) {
            log.error("文件上传失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 删除文件
     *
     * @param objectName 对象名称
     */
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .build()
            );
            log.info("文件删除成功: objectName={}", objectName);
        } catch (Exception e) {
            log.error("文件删除失败: objectName={}", objectName, e);
            throw new RuntimeException("文件删除失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件访问URL
     *
     * @param objectName 对象名称
     * @return 访问URL
     */
    public String getObjectUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .expiry(7, TimeUnit.DAYS) // 7天有效期
                            .build()
            );
        } catch (Exception e) {
            log.error("获取文件URL失败: objectName={}", objectName, e);
            // 返回直接访问URL（如果存储桶是公开的）
            return minioProperties.getEndpoint() + "/" + minioProperties.getBucketName() + "/" + objectName;
        }
    }

    /**
     * 获取文件流
     *
     * @param objectName 对象名称
     * @return 文件输入流
     */
    public InputStream getFileStream(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("获取文件流失败: objectName={}", objectName, e);
            throw new RuntimeException("获取文件失败: " + e.getMessage());
        }
    }

    /**
     * 创建存储桶（如果不存在）
     */
    private void createBucketIfNotExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .build()
            );

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(minioProperties.getBucketName())
                                .build()
                );

                // 设置存储桶策略为公开读取
                String policy = """
                    {
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Effect": "Allow",
                          "Principal": {
                            "AWS": [
                              "*"
                            ]
                          },
                          "Action": [
                            "s3:GetBucketLocation",
                            "s3:ListBucket"
                          ],
                          "Resource": [
                            "arn:aws:s3:::%s"
                          ]
                        },
                        {
                          "Effect": "Allow",
                          "Principal": {
                            "AWS": [
                              "*"
                            ]
                          },
                          "Action": [
                            "s3:GetObject"
                          ],
                          "Resource": [
                            "arn:aws:s3:::%s/*"
                          ]
                        }
                      ]
                    }
                    """.formatted(minioProperties.getBucketName(), minioProperties.getBucketName());

                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(minioProperties.getBucketName())
                                .config(policy)
                                .build()
                );

                log.info("创建存储桶并设置公开读取策略: {}", minioProperties.getBucketName());
            }
        } catch (Exception e) {
            log.error("创建存储桶失败", e);
        }
    }
}
