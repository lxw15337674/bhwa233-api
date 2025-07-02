"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const ai_module_1 = require("./feature/ai/ai.module");
const config_1 = require("@nestjs/config");
const fishing_time_module_1 = require("./feature/fishing-time/fishing-time.module");
const command_module_1 = require("./feature/command/command.module");
const bookmark_module_1 = require("./feature/bookmark/bookmark.module");
const bilibili_audio_module_1 = require("./feature/bilibili-audio/bilibili-audio.module");
const bilibili_video_module_1 = require("./feature/bilibili-video/bilibili-video.module");
const logging_middleware_1 = require("./middleware/logging.middleware");
const douyin_module_1 = require("./feature/douyin/douyin.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(logging_middleware_1.LoggingMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            fishing_time_module_1.FishingTimeModule,
            ai_module_1.AiModule,
            command_module_1.CommandModule,
            bookmark_module_1.BookmarkModule,
            bilibili_audio_module_1.BilibiliAudioModule,
            bilibili_video_module_1.BilibiliVideoModule,
            douyin_module_1.DouyinModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map