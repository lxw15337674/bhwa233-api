"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliVideoModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const bilibili_video_controller_1 = require("./bilibili-video.controller");
const bilibili_video_service_1 = require("./bilibili-video.service");
let BilibiliVideoModule = class BilibiliVideoModule {
};
exports.BilibiliVideoModule = BilibiliVideoModule;
exports.BilibiliVideoModule = BilibiliVideoModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [bilibili_video_controller_1.BilibiliVideoController],
        providers: [bilibili_video_service_1.BilibiliVideoService],
        exports: [bilibili_video_service_1.BilibiliVideoService],
    })
], BilibiliVideoModule);
//# sourceMappingURL=bilibili-video.module.js.map