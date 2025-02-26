import axios from "axios";

const SUGGESTION_API_URL = 'https://finance.pae.baidu.com/selfselect/sug'
const BD_GST_API_URL = 'https://gushitong.baidu.com/opendata'

interface SuggestData {
    QueryID: string;
    ResultCode: string;
    Result: {
        stock: Stock[];
        index: any[];
        deal_status: string;
        stock_status: {
            is_trend: string;
            time_sort: string;
        };
        refresh_time: string;
        labelMap: {
            text: string;
            ename: string;
        }[];
        isNew: string;
        follow_num: string;
    };
}

interface Stock {
    code: string;
    type: string;
    market: string;
    follow_status: string;
    amount: string;
    exchange: string;
    name: string;
    price: string;
    increase: string;
    ratio: string;
    amplitudeRatio: string;
    turnoverRatio: string;
    holdingAmount: string;
    volume: string;
    capitalization: string;
    stockStatus?: string;
    status: string;
    stockStatusInfo: string;
    subType: string;
    src_loc: string;
    peRate: string;
    pbRate: string;
    sf_url: string;
    pv: string;
    CNYPrice: string;
}

export interface StockDetail {
    ResultCode: string;
    ResultNum: string;
    QueryID: string;
    Result: Result5[];
}

interface Result5 {
    ResultURL: string;
    Weight: string;
    SrcID: string;
    ClickNeed: string;
    SubResult: any[];
    SubResNum: string;
    Sort: string;
    RecoverCacheTime: string;
    DisplayData: DisplayData;
    OriginSrcID: string;
}

export interface DisplayData {
    StdStg: string;
    StdStl: string;
    strategy: Strategy;
    resultData: ResultData;
}

interface ResultData {
    tplData: TplData;
    extData: ExtData;
}

interface ExtData {
    tplt: string;
    OriginQuery: string;
    resourceid: string;
}

interface TplData {
    cardName: string;
    templateName: string;
    StdStg: string;
    StdStl: string;
    title: string;
    result: Result4;
    ResultURL: string;
    sigma_use: string;
    normal_use: string;
    weak_use: string;
    strong_use: string;
    pk: any[];
    encoding: string;
    card_order: string;
    disp_data_url_ex: Dispdataurlex;
    data_source: string;
}

interface Dispdataurlex {
    aesplitid: string;
}

interface Result4 {
    name?: string;
    code?: string;
    exchange?: string;
    minuteUrl?: string;
    klineUrl?: string;
    fivedayUrl?: string;
    stockType?: string;
    tag_list?: Taglist[];
    foreign_key?: string;
    releaseNotes?: string;
    stock_basic?: Stockbasic;
    minute_data?: Minutedata;
    financeReport?: FinanceReport;
    accOpenData?: AccOpenData;
    market?: string;
    tabs?: Tab[];
    selectTab?: string;
}

interface Tab {
    code: string;
    stockName: string;
    market: string;
    content: Content3;
    name: string;
    type: string;
    ajaxUrl?: string;
    ajaxUrlList?: AjaxUrlList;
    voteData?: VoteData;
}

interface VoteData {
    finance_type: string;
    voteUp: string;
    voteDown: string;
    voteStatus: string;
    totalNum: string;
    voteUpRate: string;
    voteDownRate: string;
    voteRecords: VoteRecords;
    voteMethod: string;
    voteTime: string;
}

interface VoteRecords {
    code: string;
    name: string;
    market: string;
    finance_type: string;
    winRate: string;
    handleTime: string;
    isShowList: string;
    totalVoteUpNum: string;
    totalVoteDownNum: string;
    totalNum: string;
    followDays: string;
    lastVoteRecord: string;
    voteStatus: string;
    webStatusUrl: string;
    webStatusUrl_xcx_params: SfUrlxcxparams;
    list: string;
    selectType: string;
    selectTypeIndex: string;
    voteRes: VoteRe[];
}

interface VoteRe {
    title: string;
    type: string;
    voteUp: string;
    voteDown: string;
    voteUpRate: string;
    voteDownRate: string;
}

interface AjaxUrlList {
    news: string;
    tradeNews: string;
    fastNews: string;
    ads: string;
}

interface Content3 {
    fundFlowDay?: FundFlowDay;
    fundFlowWeek?: FundFlowDay;
    fundFlowMonth?: FundFlowDay;
    fundFlowMinute?: FundFlowMinute;
    fundFlowSpread?: FundFlowSpread;
    news?: News[];
    tradeNews?: News[];
    fastNews?: FastNew[];
    ads?: Ads;
    list?: List3[];
    pointTitle?: string;
    title?: string;
    tab_all_is_updated?: string;
    tab_hot_is_updated?: string;
    tab_baidu_is_updated?: string;
    askExpert?: AskExpert;
    expertList?: ExpertList;
    stockAnalysis?: StockAnalysis;
    newCompany?: NewCompany;
    companyInfo?: CompanyInfo;
    financeIndices?: FinanceIndices;
}

interface FinanceIndices {
    bvps: string;
    eps: string;
    key: string;
    lyr: string;
    nt: string;
    ntyoy: string;
    pb: string;
    reportdate: string;
    revenue: string;
    revenueyoy: string;
    title: string;
    url: string;
    StdStg: string;
    StdStl: string;
    _select_time: string;
    _update_time: string;
    _version: string;
    SiteId: string;
    cambrian_appid: string;
    loc: string;
    showlamp: string;
    wappage: string;
    ExtendedLocation: string;
    OriginQuery: string;
    tplt: string;
    resourceid: string;
    fetchkey: string;
    role_id: string;
    disp_type: string;
    appinfo: string;
    sitestatistics: string[];
}

interface CompanyInfo {
    StdStg: string;
    StdStl: string;
    _update_time: string;
    loc: string;
    lastmod: string;
    updateTime: string;
    code: string;
    marketCode: string;
    financeValue: string;
    secuCategory: string;
    id: string;
    category: Category;
    index: Index[];
    'index#num#baidu': string;
    ipoInfo: IpoInfo;
    targetFlag: string;
    ignoreCheck: string;
    tradingDay: string;
    provider: string;
    plates: Plates[];
    issuedBy: IssuedBy;
    status: string;
    securityValue: string;
    sname: string;
    clusterName: string;
    dataSign: string;
    siteinfo: string;
    marketMIC: string;
    categoryLvOne: string;
    rloc: string;
    name: string;
    type: string;
    categoryLvTwo: string;
    SiteId: string;
    _version: string;
    _select_time: string;
    logo: string;
    title: string;
    industry: string;
    intro: string;
    area: string;
    majorbiz: string;
    listingdate: string;
    stockType: string;
    url: string;
    sfUrl: string;
    style: string;
}

interface NewCompany {
    basicInfo: BasicInfo;
    shareholderEquity: ShareholderEquity;
    organRating: OrganRating;
    executiveInfo: ExecutiveInfo;
    bonusTransfer: BonusTransfer;
}

interface BonusTransfer {
    title: string;
    header: string[];
    body: string[][];
    sfUrl_xcx_params: SfUrlxcxparams;
    webStatusUrl: string;
}

interface SfUrlxcxparams {
    xcx_appkey: string;
    xcx_path: string;
    xcx_from: string;
    xcx_url: string;
    xcx_query: string;
}

interface ExecutiveInfo {
    title: string;
    url: string;
    header: string[];
    body: Body2[];
}

interface Body2 {
    executive: string;
    post: string;
    holdingCapital: string;
    holdingCapitalChange: string;
    annualReward: string;
}

interface OrganRating {
    title: string;
    organNum: string;
    curPrice: string;
    avgPrice: string;
    maxPrice: string;
    minPrice: string;
    header: string[];
    body: Body[];
}

interface Body {
    organ: string;
    date: string;
    rating: string;
    price: string;
}

interface ShareholderEquity {
    title: string;
    url: string;
    info: Info2[];
}

interface Info2 {
    text: string;
    value: Value | string;
    type?: string;
}

interface Value {
    sum: string;
    qoq: string;
    qoqStatus: string;
}

interface BasicInfo {
    title: string;
    companyCode: string;
    innerCode: string;
    industry: Industry[];
    concepts: Industry[];
    companyName: string;
    releaseDate: string;
    issuePrice: string;
    issueNumber: string;
    region: string;
    mainBusiness: string;
    area: Industry[];
}

interface Industry {
    text: string;
    url: string;
    webStatusUrlUrl_xcx_params: WebStatusUrlUrlxcxparams;
    webStatusUrl: string;
}

interface WebStatusUrlUrlxcxparams {
    xcx_appkey: string;
    xcx_from: string;
    xcx_path: string;
    xcx_query: string;
}

interface StockAnalysis {
    overall: Overall;
    levelScore: LevelScore[];
    analysisInfo: AnalysisInfo[];
    summary: string;
    tip: string;
}

interface AnalysisInfo {
    text: string;
    value: string;
}

interface LevelScore {
    text: string;
    score: string;
}

interface Overall {
    score: string;
    suggest: string;
    stocktotal: string;
    content: string[];
    valuationStatus: ValuationStatus;
}

interface ValuationStatus {
    text: string;
    highlight: string;
}

interface ExpertList {
    title: string;
    list: any[];
    isInfiniteLoad: string;
    ajaxUrl: string;
    fast_wg: Askurl;
    total_num: string;
    async_url: string;
}

interface AskExpert {
    key: string;
    title: string;
    description: string;
    ask_url: Askurl;
    btn_text: string;
}

interface Askurl {
    type: string;
    url: string;
    di: string;
    sec: string;
}

interface List3 {
    StdStg: string;
    allow_comment: string;
    is_self: string;
    is_uped: string;
    content: Content2;
    extcom: Extcom;
    author: Author;
    like_count: string;
    reply_count: string;
    provider: string;
    create_time: string;
    publish_time: string;
    create_show_time: string;
    type: string;
    comment_id: string;
    real_loc: string;
    third_url: string;
    loc: string;
    thread_id: string;
    reply_id: string;
    parent_id: string;
    is_forgery: string;
}

interface Author {
    name: string;
    image: Image;
}

interface Image {
    alt: string;
    src: string;
}

interface Extcom {
    comment: string;
}

interface Content2 {
    items: Item[];
}

interface Ads {
    list: List2[];
    pos: Pos;
}

interface Pos {
    first_pos: string;
    input_times: string;
    fixed_pos: string;
}

interface List2 {
    material: Material[];
    id: string;
    extra: Extra[];
    advisible: string;
    productId: string;
    moduleType: string;
    clientType: string;
    ext_info: string;
}

interface Extra {
    k: string;
    v: string;
}

interface Material {
    id: string;
    info: Info[];
}

interface Info {
    adType: string;
}

interface FastNew {
    time: string;
    label: string;
    labelType: string;
    content: string;
    news_id: string;
    loc: string;
    more_url: string;
}

interface News {
    lastmod: string;
    type: string;
    name: string;
    code: string;
    title: string;
    publish_time: string;
    provider: string;
    original_url: string;
    third_url: string;
    content: Content;
    benefit_mark: string;
    is_keynews: string;
    locate_url: string;
    is_self_build: string;
    sf_url: string;
    news_id: string;
    evaluate: string;
}

interface Content {
    items: Item[];
    'items#num#baidu': string;
}

interface Item {
    data: string;
    type: string;
}

interface FundFlowSpread {
    result: Result3;
    date: string;
    unit: string;
    updateTime: string;
    async_url: string;
}

interface Result3 {
    super_grp: Supergrp;
    large_grp: Supergrp;
    medium_grp: Supergrp;
    little_grp: Supergrp;
    turnover_in_total: string;
    turnover_out_total: string;
}

interface Supergrp {
    turnover_in: string;
    turnover_out: string;
    net_turnover: string;
    turnover_in_rate: string;
    turnover_out_rate: string;
}

interface FundFlowMinute {
    date: string;
    unit: string;
    updateTime: string;
    async_url: string;
    result: Result2;
}

interface Result2 {
    main: Main2[];
    retail: Main2[];
    total: Main2[];
}

interface Main2 {
    turnover_in: string;
    turnover_out: string;
    net_turnover: string;
    time: string;
}

interface FundFlowDay {
    unit: string;
    updateTime: string;
    async_url: string;
    result: Result;
}

interface Result {
    main: Main[];
    retail: Main[];
    total: Main[];
    close_px: Closepx[];
}

interface Closepx {
    close_px: string;
    date: string;
}

interface Main {
    turnover_in: string;
    turnover_out: string;
    net_turnover: string;
    date: string;
}

interface AccOpenData {
    start_date: string;
    end_date: string;
    is_close_time: string;
    is_ad: string;
    logo: string;
    title: string;
    rdetail: string;
    sdetail: string;
    urlType: string;
    button: string;
    labels: string[];
    url: string;
    ad_params: Adparams;
}

interface Adparams {
    query: string;
}

interface FinanceReport {
    text: string;
}

interface Minutedata {
    priceinfo: Priceinfo[];
    pankouinfos: Pankouinfos;
    basicinfos: Basicinfos;
    askinfos: Askinfo[];
    buyinfos: Buyinfo[];
    detailinfos: Detailinfo[];
    update: Update;
    newMarketData: NewMarketData;
    provider: string;
    cur: Cur;
    upDownStatus: string;
    isKc: string;
    adr_info: any[];
    member_info: Memberinfo;
    chartTabs: ChartTab[];
}

interface ChartTab {
    text: string;
    type: string;
    isK: string;
    asyncUrl?: string;
    options?: Option[];
}

interface Option {
    text: string;
    type: string;
    isK: string;
    asyncUrl: string;
}

interface Memberinfo {
    up: Up;
    down: Up;
    balance: Up;
}

interface Up {
    number: string;
    precent: string;
}

interface Cur {
    time: string;
    price: string;
    ratio: string;
    increase: string;
    volume: string;
    avgPrice: string;
    amount: string;
    timeKey: string;
    datetime: string;
    oriAmount: string;
    show: string;
    unit: string;
}

interface NewMarketData {
    headers: string[];
    maxPoints: string;
    cx: string[];
    cxData: string[];
    keys: string[];
    marketData: MarketDatum[];
}

interface MarketDatum {
    date: string;
    p: string;
}

interface Update {
    text: string;
    time: string;
    realUpdateTime: string;
    timezone: string;
    shortZone: string;
    time_diff: string;
    stockStatus: string;
}

interface Detailinfo {
    time: string;
    volume: string;
    price: string;
    type: string;
    bsFlag: string;
    formatTime: string;
}

interface Buyinfo {
    bidprice: string;
    bidvolume: string;
}

interface Askinfo {
    askprice: string;
    askvolume: string;
}

interface Basicinfos {
    exchange: string;
    code: string;
    name: string;
    stockStatus: string;
    stock_market_code: string;
}

interface Pankouinfos {
    indicatorTitle: string;
    indicatorUrl: string;
    list: List[];
    origin_pankou: Originpankou;
}

interface Originpankou {
    open: string;
    preClose: string;
    volume: string;
    turnoverRatio: string;
    high: string;
    low: string;
    limitUp: string;
    limitDown: string;
    inside: string;
    outside: string;
    amount: string;
    amplitudeRatio: string;
    weibiRatio: string;
    volumeRatio: string;
    currencyValue: string;
    capitalization: string;
    peratio: string;
    lyr: string;
    bvRatio: string;
    perShareEarn: string;
    netAssetsPerShare: string;
    circulatingCapital: string;
    totalShareCapital: string;
    priceLimit: string;
    w52_low: string;
    w52_high: string;
    expire_date: string;
    holdingAmount: string;
    prevSettlement: string;
    settlement: string;
    amountDelta: string;
    currentPrice: string;
}

interface List {
    ename: string;
    name: string;
    value: string;
    status?: string;
    helpIcon?: string;
}

interface Priceinfo {
    time: string;
    price: string;
    ratio: string;
    increase: string;
    volume: string;
    avgPrice: string;
    amount: string;
    timeKey: string;
    datetime: string;
    oriAmount: string;
    show: string;
}

interface Stockbasic {
    StdStg: string;
    StdStl: string;
    _update_time: string;
    loc: string;
    lastmod: string;
    updateTime: string;
    code: string;
    marketCode: string;
    financeValue: string;
    secuCategory: string;
    id: string;
    category: Category;
    index: Index[];
    'index#num#baidu': string;
    ipoInfo: IpoInfo;
    targetFlag: string;
    ignoreCheck: string;
    tradingDay: string;
    provider: string;
    plates: Plates;
    issuedBy: IssuedBy;
    status: string;
    securityValue: string;
    sname: string;
    clusterName: string;
    dataSign: string;
    siteinfo: string;
    marketMIC: string;
    categoryLvOne: string;
    rloc: string;
    name: string;
    type: string;
    categoryLvTwo: string;
    SiteId: string;
    _version: string;
    _select_time: string;
    logo: string;
}

interface IssuedBy {
    industry: string;
    mainBusiness: string;
    description: string;
    area: string;
}

interface Plates {
    code: string;
    name: string;
}

interface IpoInfo {
    publishProspectus: PublishProspectus;
    endSubscription: PublishProspectus;
    startSubscription: StartSubscription;
    listing: Listing;
}

interface Listing {
    status: string;
    releaseDate: string;
    name: string;
}

interface StartSubscription {
    status: string;
    releaseDate: string;
    equityIssuance: string;
    name: string;
    currency: string;
}

interface PublishProspectus {
    status: string;
    releaseDate: string;
    subscriptionPrice: string;
    name: string;
    currency: string;
}

interface Index {
    contribution: string;
    code: string;
    name: string;
}

interface Category {
    categoryLv1: string[];
    'categoryLv1#num#baidu': string;
    categoryLv2: string[];
    'categoryLv2#num#baidu': string;
}

interface Taglist {
    desc: string;
    imageUrl: string;
    ext?: string;
}

interface Strategy {
    tempName: string;
    precharge: string;
    ctplOrPhp: string;
    hilightWord: string;
}

function extractPrices(stock: Stock) {
    const name = stock.name;
    const currentPrice = parseFloat(stock.price);

    const isGrowing = Number(stock.increase) >= 0;
    return `${name}(${stock.code}): ${currentPrice} (${isGrowing ? '📈' : '📉'}${stock.ratio})`;
}

// 定义金融产品类型枚举
export enum FinancialProductType {
    INDEX = 'index',
    FUTURES = 'futures',
    STOCK = 'stock',
    FOREIGN = 'foreign'
}

export async function getStockSuggest(
    searchText = '上证指数',
    type: FinancialProductType[] = [
        FinancialProductType.INDEX,
        FinancialProductType.FUTURES,
        FinancialProductType.STOCK,
        FinancialProductType.FOREIGN
    ]
): Promise<Stock | undefined> {
    try {
        const response = await axios.get<SuggestData>(SUGGESTION_API_URL, {
            params: {
                wd: searchText,
                skip_login: 1,
                finClientType: 'pc'
            },
            headers: {
                Host: 'finance.pae.baidu.com'
            },
        });

        if (response.status === 200 && response.data.Result.stock.length > 0) {
            return response.data.Result.stock.find(stock => {
                return type.includes(stock.type as FinancialProductType);
            });
        }

        return undefined;
    } catch (err) {
        return undefined;
    }
}

export async function getStockData(symbol: string): Promise<string> {
    try {
        const symbols = symbol.split(/\s+/);  // 按空格分割多个股票代码
        const results = await getMultipleStocksData(symbols);
        return results.join('\n\n');  // 用两个换行符分隔每个股票的数据，增加可读性
    } catch (error: unknown) {
        if (error instanceof Error) {
            return `❌ 获取 ${symbol} 失败：${error.message}`;
        }
        return `❌ 获取 ${symbol} 失败：未知错误`;
    }
}

// 新增辅助函数用于并行获取多个股票数据
async function getMultipleStocksData(symbols: string[]): Promise<string[]> {
    const promises = symbols.map(async (symbol) => {
        try {
            return await getStockBasicData(symbol);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return `❌ 获取 ${symbol} 失败：${error.message}`;
            }
            return `❌ 获取 ${symbol} 失败：未知错误`;
        }
    });
    return await Promise.all(promises);
}

export async function getStockBasicData(symbol: string): Promise<string> {
    const suggestedSymbol = await getStockSuggest(symbol)
    if (!suggestedSymbol) throw new Error('未找到相关股票');

    return extractPrices(suggestedSymbol);
}

export async function getStockDetailData(symbol: string) {
    const suggestedSymbol = await getStockSuggest(symbol)
    if (!suggestedSymbol) throw new Error('未找到相关股票');

    const result = await fetchStockDetailData(suggestedSymbol)

    const data = result.resultData.tplData.result.minute_data
    if (!data) throw new Error('未找到相关股票');

    const { pankouinfos, basicinfos, cur } = data

    const isGrowing = Number(cur.increase) >= 0;
    const trend = isGrowing ? '📈' : '📉';

    const pankouData: string[] = [];

    pankouData.push(`${basicinfos.name}(${basicinfos.code})`)
    pankouData.push(`现价：${cur.price} ${trend} ${cur.ratio}`)

    pankouinfos.list.forEach(item => {
        pankouData.push(`${item.name}: ${item.value}`)
    })

    return pankouData.join('\n');
}

export async function fetchStockDetailData(suggest: { code: string; type: string, market: string }) {
    // 定义资源ID映射
    const RESOURCE_IDS = {
        'ab': '5429',
        'hk': '5430',
        'us': '5431',
        'index': '5352',
        'foreign': '5343',
        'uk': '5566',
        'bk': '5782',
        'block': '50748',
        'futures': '51287'
    } as const;

    const params = {
        openapi: "1",
        dspName: "iphone",
        client: "app",
        query: suggest.code,
        code: suggest.code,
        word: suggest.code,
        resource_id: RESOURCE_IDS[suggest.type as keyof typeof RESOURCE_IDS] || RESOURCE_IDS[suggest.market as keyof typeof RESOURCE_IDS],
        finClientType: "pc",
        market: suggest.market
    }

    const response = await axios.get<StockDetail>(BD_GST_API_URL, {
        params
    })

    const result = response.data.Result?.find(item => ['stock_quotation_info', 'unitstatic', 'index_sf_quotations'].includes(item.DisplayData.strategy.tempName))

    if (!result) throw new Error('未找到相关股票')

    return result.DisplayData
}
