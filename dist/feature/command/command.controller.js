"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const command_service_1 = require("./command.service");
let CommandController = class CommandController {
    constructor(commandService) {
        this.commandService = commandService;
    }
    async executeCommand(command) {
        return this.commandService.executeCommand(command);
    }
    async getCommandList() {
        return this.commandService.getCommandList();
    }
};
exports.CommandController = CommandController;
__decorate([
    (0, common_1.Get)(''),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)('command')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommandController.prototype, "executeCommand", null);
__decorate([
    (0, common_1.Get)('hp'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommandController.prototype, "getCommandList", null);
exports.CommandController = CommandController = __decorate([
    (0, common_1.Controller)('command'),
    __metadata("design:paramtypes", [command_service_1.CommandService])
], CommandController);
//# sourceMappingURL=command.controller.js.map