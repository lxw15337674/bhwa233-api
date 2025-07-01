"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinModule = void 0;
const common_1 = require("@nestjs/common");
const douyin_controller_1 = require("./douyin.controller");
const douyin_service_1 = require("./douyin.service");
let DouyinModule = class DouyinModule {
};
exports.DouyinModule = DouyinModule;
exports.DouyinModule = DouyinModule = __decorate([
    (0, common_1.Module)({
        controllers: [douyin_controller_1.DouyinController],
        providers: [douyin_service_1.DouyinService],
    })
], DouyinModule);
//# sourceMappingURL=douyin.module.js.map