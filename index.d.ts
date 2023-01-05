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
 * @param {MemberList} list
 * @return {string}
 */
export function serializeList(list: MemberList): string;
/**
 * @param {Object} value
 * @return {string}
 */
export function serializeInnerList(value: any): string;
/**
 * @param {Object} params
 * @return {string}
 */
export function serializeParams(params: any): string;
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
 * @param {any} value
 * @return {string}
 */
export function serializeBareItem(value: any): string;
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
 * @param {boolean} value
 * @return {string}
 */
export function serializeBoolean(value: boolean): string;
/**
 * @param {Uint8Array} value
 * @return {string}
 */
export function serializeByteSequence(value: Uint8Array): string;
/**
 * @typedef {Array.<Item|InnerList>} MemberList
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
 * @typedef {{value: ItemList, params: Parameters}} InnerList
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
 * @typedef {Object.<Key, Item|InnerList>|Map} Dictionary
 *
 * @typedef {Object} ParsedDictionary
 * @property {Dictionary} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @param {Object?} option TODO: not fully supported yet
 * @return {ParsedDictionary}
 */
export function parseDictionary(input_string: string, option?: any | null): ParsedDictionary;
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
 * @typedef {ParsedString|ParsedByteSequence|ParsedBoolean|ParsedIntegerOrDecimal|ParsedToken} ParsedBareItem
 *
 * @param {string} input_string
 * @return {ParsedBareItem}
 */
export function parseBareItem(input_string: string): ParsedBareItem;
/**
 * @typedef {string | Uint8Array | boolean | number | symbol} BareItem
 *
 * @typedef {Object.<Key, BareItem>} Parameters
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
 * @param {string} str
 * @return {Uint8Array}
 */
export function base64decode(str: string): Uint8Array;
/**
 * @param {Uint8Array} binary
 * @return {string}
 */
export function base64encode(binary: Uint8Array): string;
export class Item {
    /**
     * @property {BareItem} value
     * @property {Parameters} params
     */
    constructor(value: any, params?: any);
    value: any;
    params: any;
}
export type MemberList = Array<Item | InnerList>;
export type ParsedList = {
    value: MemberList;
    input_string: string;
};
export type ParsedItemOrInnerList = ParsedItem | ParsedInnerList;
export type ItemList = Array<Item>;
export type InnerList = {
    value: Item[];
    params: Parameters;
};
export type ParsedInnerList = {
    value: InnerList;
    input_string: string;
};
export type Dictionary = any | Map<any, any>;
export type ParsedDictionary = {
    value: Dictionary;
    input_string: string;
};
export type ParsedItem = {
    value: Item;
    input_string: string;
};
export type ParsedBareItem = ParsedString | ParsedByteSequence | ParsedBoolean | ParsedIntegerOrDecimal | ParsedToken;
export type BareItem = string | Uint8Array | boolean | number | symbol;
export type Parameters = any;
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
