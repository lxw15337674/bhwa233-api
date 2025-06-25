"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandModule = void 0;
const common_1 = require("@nestjs/common");
const command_controller_1 = require("./command.controller");
const command_service_1 = require("./command.service");
const ai_module_1 = require("../ai/ai.module");
let CommandModule = class CommandModule {
};
exports.CommandModule = CommandModule;
exports.CommandModule = CommandModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule],
        controllers: [command_controller_1.CommandController],
        providers: [command_service_1.CommandService],
        exports: [command_service_1.CommandService],
    })
], CommandModule);
//# sourceMappingURL=command.module.js.map