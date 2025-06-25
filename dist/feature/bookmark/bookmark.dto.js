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
exports.CreateBookmarkDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateBookmarkDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { url: { required: true, type: () => String, format: "uri" }, title: { required: false, type: () => String }, image: { required: false, type: () => String }, remark: { required: false, type: () => String }, content: { required: false, type: () => String } };
    }
}
exports.CreateBookmarkDto = CreateBookmarkDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookmark URL',
        example: 'https://example.com'
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'URL cannot be empty' }),
    (0, class_validator_1.IsUrl)({}, { message: 'Invalid URL format' }),
    __metadata("design:type", String)
], CreateBookmarkDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookmark title',
        example: 'Example Website',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookmarkDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookmark image URL',
        example: 'https://example.com/image.jpg',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookmarkDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bookmark remark',
        example: 'This is a useful website',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookmarkDto.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page content for AI summary',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookmarkDto.prototype, "content", void 0);
//# sourceMappingURL=bookmark.dto.js.map