"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFishingTimeDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_fishing_time_dto_1 = require("./create-fishing-time.dto");
class UpdateFishingTimeDto extends (0, swagger_1.PartialType)(create_fishing_time_dto_1.CreateFishingTimeDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateFishingTimeDto = UpdateFishingTimeDto;
//# sourceMappingURL=update-fishing-time.dto.js.map