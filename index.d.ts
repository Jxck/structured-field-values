/**
 * @param {Item} value
 * @returns {string}
 */
export function encodeItem(value: Item): string;
/**
 * @param {MemberList} value
 * @returns {string}
 */
export function encodeList(value: MemberList): string;
/**
 * @param {Dictionary} value
 * @returns {string}
 */
export function encodeDict(value: Dictionary): string;
/**
 * @param {string} input
 * @returns {Item}
 */
export function decodeItem(input: string): Item;
/**
 * @param {string} input
 * @returns {MemberList}
 */
export function decodeList(input: string): MemberList;
/**
 * @param {string} input
 * @returns {Dictionary}
 */
export function decodeDict(input: string): Dictionary;
/**
 * @param {string} input
 * @returns {Dictionary}
 */
export function decodeMap(input: string): Dictionary;
/**
 * @param {MemberList} list
 * @return {string}
 */
export function serializeList(list: MemberList): string;
/**
 * @param {InnerList} value
 * @return {string}
 */
export function serializeInnerList(value: InnerList): string;
/**
 * @param {Parameters} params
 * @return {string}
 */
export function serializeParams(params: Parameters): string;
/**
 * @param {string} value
 * @return {string}
 */
export function serializeKey(value: string): string;
/**
 * @param {Dictionary} dict
 * @return {string}
 */
export function serializeDict(dict: Dictionary): string;
/**
 * @param {Item} value
 * @return {string}
 */
export function serializeItem(value: Item): string;
/**
 * @param {BareItem} value
 * @return {string}
 */
export function serializeBareItem(value: BareItem): string;
/**
 * @param {number} value
 * @return {string}
 */
export function serializeInteger(value: number): string;
/**
 * @param {number} value
 * @return {string}
 */
export function serializeDecimal(value: number): string;
/**
 * @param {string} value
 * @return {string}
 */
export function serializeString(value: string): string;
/**
 * @param {symbol} token
 * @return {string}
 */
export function serializeToken(token: symbol): string;
/**
 * @param {Uint8Array} value
 * @return {string}
 */
export function serializeByteSequence(value: Uint8Array): string;
/**
 * @param {boolean} value
 * @return {string}
 */
export function serializeBoolean(value: boolean): string;
/**
 * @param {Date} value
 * @return {string}
 */
export function serializeDate(value: Date): string;
/**
 * @param {string} input_sequence
 * @return {string}
 */
export function serializeDisplayString(input_sequence: string): string;
/**
 * allow BareItem (JS Primitives) for usability
 * @typedef {Array.<Item|InnerList|BareItem|Array<BareItem>>} MemberList
 *
 * @typedef {Object} ParsedList
 * @property {MemberList} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedList}
 */
export function parseList(input_string: string): ParsedList;
/**
 * @typedef {ParsedItem|ParsedInnerList} ParsedItemOrInnerList
 *
 * @param {string} input_string
 * @return {ParsedItemOrInnerList}
 */
export function parseItemOrInnerList(input_string: string): ParsedItemOrInnerList;
/**
 * @typedef {Array.<Item>} ItemList
 *
 * @typedef {Object} ParsedInnerList
 * @property {InnerList} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedInnerList}
 */
export function parseInnerList(input_string: string): ParsedInnerList;
/**
 * @typedef {Item|InnerList|BareItem|Array<BareItem>}DictValue
 * @typedef {Array<[string, DictValue]>} OrderedMap
 * @typedef {Object.<string, DictValue>|Map.<string, DictValue>} Dictionary
 *
 * @typedef {Object} ParsedDictionary
 * @property {OrderedMap} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedDictionary}
 */
export function parseDictionary(input_string: string): ParsedDictionary;
/**
 * @typedef {Object} ParsedItem
 * @property {Item} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedItem}
 */
export function parseItem(input_string: string): ParsedItem;
/**
 * @typedef {ParsedString|ParsedByteSequence|ParsedBoolean|ParsedIntegerOrDecimal|ParsedToken|ParsedDate|ParsedDisplayString} ParsedBareItem
 *
 * @param {string} input_string
 * @return {ParsedBareItem}
 */
export function parseBareItem(input_string: string): ParsedBareItem;
/**
 * @typedef {string | Uint8Array | boolean | number | symbol | Date} BareItem
 *
 * @typedef {Object.<string, BareItem>} Parameters
 *
 * @typedef {Object} ParsedParameters
 * @property {Parameters} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedParameters}
 */
export function parseParameters(input_string: string): ParsedParameters;
/**
 * @typedef {string} Key
 *
 * @typedef {Object} ParsedKey
 * @property {Key} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedKey}
 */
export function parseKey(input_string: string): ParsedKey;
/**
 * @typedef {Object} ParsedIntegerOrDecimal
 * @property {number} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedIntegerOrDecimal}
 */
export function parseIntegerOrDecimal(input_string: string): ParsedIntegerOrDecimal;
/**
 * @typedef {Object} ParsedString
 * @property {string} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedString}
 */
export function parseString(input_string: string): ParsedString;
/**
 * @typedef {Object} ParsedToken
 * @property {symbol} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedToken}
 */
export function parseToken(input_string: string): ParsedToken;
/**
 * @typedef {Object} ParsedByteSequence
 * @property {Uint8Array} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedByteSequence}
 */
export function parseByteSequence(input_string: string): ParsedByteSequence;
/**
 * @typedef {Object} ParsedBoolean
 * @property {boolean} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedBoolean}
 */
export function parseBoolean(input_string: string): ParsedBoolean;
/**
 * @typedef {Object} ParsedDate
 * @property {Date} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedDate}
 */
export function parseDate(input_string: string): ParsedDate;
/**
 * @typedef {Object} ParsedDisplayString
 * @property {string} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedDisplayString}
 */
export function parseDisplayString(input_string: string): ParsedDisplayString;
/**
 * @param {string} str
 * @return {Uint8Array}
 */
export function base64decode(str: string): Uint8Array;
/**
 * @param {Uint8Array} binary
 * @return {string}
 */
export function base64encode(binary: Uint8Array): string;
/**
 * Discard any leading SP characters from input_string
 *
 * @param {string} input_string
 * @return {string}
 */
export function leadingSP(input_string: string): string;
/**
 * Discard any leading OWS characters from input_string.
 *
 * @param {string} input_string
 * @return {string}
 */
export function leadingOWS(input_string: string): string;
export class Item {
    /**
     * @param {BareItem} value
     * @param {Parameters} params
     */
    constructor(value: BareItem, params?: Parameters);
    value: BareItem;
    params: {
        [x: string]: BareItem;
    };
}
export class InnerList {
    /**
     * @param {ItemList} value
     * @param {Parameters} params
     */
    constructor(value: ItemList, params?: Parameters);
    value: ItemList;
    params: {
        [x: string]: BareItem;
    };
}
/**
 * allow BareItem (JS Primitives) for usability
 */
export type MemberList = Array<Item | InnerList | BareItem | Array<BareItem>>;
/**
 * allow BareItem (JS Primitives) for usability
 */
export type ParsedList = {
    value: MemberList;
    input_string: string;
};
export type ParsedItemOrInnerList = ParsedItem | ParsedInnerList;
export type ItemList = Array<Item>;
export type ParsedInnerList = {
    value: InnerList;
    input_string: string;
};
export type DictValue = Item | InnerList | BareItem | Array<BareItem>;
export type OrderedMap = Array<[string, DictValue]>;
export type Dictionary = {
    [x: string]: DictValue;
} | Map<string, DictValue>;
export type ParsedDictionary = {
    value: OrderedMap;
    input_string: string;
};
export type ParsedItem = {
    value: Item;
    input_string: string;
};
export type ParsedBareItem = ParsedString | ParsedByteSequence | ParsedBoolean | ParsedIntegerOrDecimal | ParsedToken | ParsedDate | ParsedDisplayString;
export type BareItem = string | Uint8Array | boolean | number | symbol | Date;
export type Parameters = {
    [x: string]: BareItem;
};
export type ParsedParameters = {
    value: Parameters;
    input_string: string;
};
export type Key = string;
export type ParsedKey = {
    value: Key;
    input_string: string;
};
export type ParsedIntegerOrDecimal = {
    value: number;
    input_string: string;
};
export type ParsedString = {
    value: string;
    input_string: string;
};
export type ParsedToken = {
    value: symbol;
    input_string: string;
};
export type ParsedByteSequence = {
    value: Uint8Array;
    input_string: string;
};
export type ParsedBoolean = {
    value: boolean;
    input_string: string;
};
export type ParsedDate = {
    value: Date;
    input_string: string;
};
export type ParsedDisplayString = {
    value: string;
    input_string: string;
};
