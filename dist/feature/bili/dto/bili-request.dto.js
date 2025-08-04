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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiliDownloadDto = exports.BiliUrlDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class BiliUrlDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { url: { required: true, type: () => String, format: "uri" } };
    }
}
exports.BiliUrlDto = BiliUrlDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bilibili video URL',
        example: 'https://www.bilibili.com/video/BV12P4y1s7aD',
        required: true
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'URL cannot be empty' }),
    (0, class_validator_1.IsString)({ message: 'URL must be a string' }),
    (0, class_validator_1.IsUrl)({}, { message: 'Invalid URL format' }),
    __metadata("design:type", String)
], BiliUrlDto.prototype, "url", void 0);
class BiliDownloadDto extends BiliUrlDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { range: { required: false, type: () => String }, quality: { required: false, type: () => String } };
    }
}
exports.BiliDownloadDto = BiliDownloadDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Range header for partial content requests',
        example: 'bytes=0-1023',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BiliDownloadDto.prototype, "range", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quality preference for video downloads',
        example: '1080p',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BiliDownloadDto.prototype, "quality", void 0);
//# sourceMappingURL=bili-request.dto.js.map