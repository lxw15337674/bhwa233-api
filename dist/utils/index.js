"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToNumber = exports.formatAmount = void 0;
const decimal_js_1 = require("decimal.js");
const formatAmount = (num) => {
    if (num === null || num === undefined) {
        return '';
    }
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    let result = '';
    if (absNum >= 100000000) {
        result =
            new decimal_js_1.default(absNum).dividedBy(100000000).toDecimalPlaces(2).toString() +
                '亿';
    }
    else if (absNum >= 10000) {
        result =
            new decimal_js_1.default(absNum).dividedBy(10000).toDecimalPlaces(2).toString() + '万';
    }
    else {
        result = new decimal_js_1.default(absNum).toDecimalPlaces(2).toString();
    }
    return isNegative ? '-' + result : result;
};
exports.formatAmount = formatAmount;
const convertToNumber = (num) => {
    if (num === null || num === undefined) {
        return '';
    }
    const decimalNum = new decimal_js_1.default(num);
    const truncated = decimalNum.toDecimalPlaces(2, decimal_js_1.default.ROUND_DOWN);
    if (truncated.isZero()) {
        return '0.00';
    }
    const isNegative = truncated.isNegative();
    const absoluteValue = truncated.abs();
    const [integerPart, decimalPart = '00'] = absoluteValue.toString().split('.');
    const paddedDecimalPart = decimalPart.padEnd(2, '0');
    return `${isNegative ? '-' : ''}${integerPart}.${paddedDecimalPart}`;
};
exports.convertToNumber = convertToNumber;
//# sourceMappingURL=index.js.map