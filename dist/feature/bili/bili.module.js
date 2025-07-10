"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const bili_controller_1 = require("./bili.controller");
const bili_service_1 = require("./bili.service");
const bili_api_client_1 = require("./lib/bili-api-client");
const bili_stream_handler_1 = require("./lib/bili-stream-handler");
let BiliModule = class BiliModule {
};
exports.BiliModule = BiliModule;
exports.BiliModule = BiliModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [bili_controller_1.BiliController],
        providers: [
            bili_service_1.BiliService,
            bili_api_client_1.BiliApiClient,
            bili_stream_handler_1.BiliStreamHandler
        ],
        exports: [bili_service_1.BiliService],
    })
], BiliModule);
//# sourceMappingURL=bili.module.js.map