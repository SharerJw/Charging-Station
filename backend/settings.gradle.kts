rootProject.name = "ev-charging-platform"

// 公共模块
include("ev-common:ev-common-core")
include("ev-common:ev-common-mybatis")
include("ev-common:ev-common-redis")
include("ev-common:ev-common-security")

// 网关
include("ev-gateway")

// 业务服务
include("ev-service:ev-service-identity")
include("ev-service:ev-service-station")
include("ev-service:ev-service-order")
include("ev-service:ev-service-charging")
include("ev-service:ev-service-simulator")
