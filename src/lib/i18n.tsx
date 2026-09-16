import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "zh-CN";

const STORAGE_KEY = "tms.locale";

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh-CN") return saved;
  } catch {
    /* localStorage unavailable */
  }
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || "en"];
  for (const l of langs) {
    const norm = l.toLowerCase();
    if (norm.startsWith("zh")) return "zh-CN";
  }
  return "en";
}

// ---------- dictionaries ----------
// Values may be strings or (data) => string functions for interpolation.

type Dict = Record<string, string | ((...args: never[]) => string)>;

const en: Dict = {
  // Nav / shell
  "nav.dashboard": "Dashboard",
  "nav.subscriptions": "Subscriptions",
  "nav.year": "Year",
  "nav.manage": "Manage",
  "nav.homeCurrency": "Home currency",
  "nav.signOut": "Sign out",
  "app.name": "Track My Subscriptions",

  // Common
  "common.add": "Add",
  "common.edit": "Edit",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.back": "Back",
  "common.loading": "Loading…",
  "common.today": "Today",
  "common.tomorrow": "Tomorrow",
  "common.daysAgo": (n: unknown) => `${n} days ago`,
  "common.inDays": (n: unknown) => `In ${n} days`,
  "common.renewsToday": "Renews today",
  "common.renewsTomorrow": "Renews tomorrow",
  "common.renewsOn": (d: unknown) => `Renews ${d}`,
  "common.renewalPassed": "Renewal date passed",
  "common.perMonth": "per month",
  "common.perMonthShort": "/mo",
  "common.perYear": "/yr",
  "common.wasPerMonth": (x: unknown) => `was ${x}/mo`,
  "common.cancelledOn": (d: unknown) => `Cancelled ${d}`,
  "common.cancelled": "Cancelled",
  "common.notSet": "Not set",
  "common.noneNoted": "None noted",
  "common.optional": "optional",
  "common.all": "All",
  "common.search": "Search…",
  "common.sort": "Sort",
  "common.year": "year",
  "common.month": "month",
  "common.day": "day",
  "common.days": "days",

  // Landing
  "landing.badge": "For anyone tired of mystery renewals",
  "landing.heroTitle": "Know exactly what your subscriptions cost you",
  "landing.heroBody":
    "Track every recurring service in one place — monthly totals, yearly totals, upcoming renewals, and a quiet nudge when something stops earning its keep.",
  "landing.ctaStart": "Start tracking free",
  "landing.ctaHow": "See how it works",
  "landing.noCard": "Free · No card required · Works great on your phone",
  "landing.featuresTitle": "Everything you need, nothing you don't",
  "landing.featuresBody":
    "Built around a simple idea: a small, honest picture of your recurring spending, and the tools to keep it that way.",
  "landing.ctaTitle": "Ready to see the whole picture?",
  "landing.ctaBody":
    "Set up takes a couple of minutes, and sample data is ready the moment you sign in.",
  "landing.ctaButton": "Create your account",
  "landing.f1.title": "One honest monthly number",
  "landing.f1.body":
    "Every subscription converts to a monthly and yearly figure in your home currency, so the real total is never a mystery.",
  "landing.f2.title": "Renewals, before they happen",
  "landing.f2.body":
    "See exactly what renews in the next 7 and 30 days. No more surprise charges quietly leaving your account.",
  "landing.f3.title": "Should I keep this?",
  "landing.f3.body":
    "Record how often you actually use each service. Expensive-but-rarely-used and 60-day-idle subscriptions get flagged for a closer look.",
  "landing.f4.title": "Yearly comparison",
  "landing.f4.body":
    "Watch your recurring spend trend over the years and see whether it's creeping up — or finally heading down.",
  "landing.f5.title": "Everything in one catalog",
  "landing.f5.body":
    "Search, filter by category, and open any subscription to see its full history, notes, and review details.",
  "landing.footerTag": "A simple, private record of what you pay for.",
  "landing.monthly": "Monthly",
  "landing.yearly": "Yearly",
  "landing.due7": "Due in 7 days",

  // Auth
  "auth.signIn": "Sign in",
  "auth.signInToContinue": "Sign in to continue",
  "auth.onlySignedIn": "This page is only available to signed-in users.",
  "auth.returnNote": "You'll come straight back to this page once you're signed in.",
  "auth.backHome": "Back to home",
  "auth.getStarted": "Get Started",
  "auth.enterEmail": "Enter your email to log in or sign up",
  "auth.emailPlaceholder": "name@example.com",
  "auth.or": "Or",
  "auth.guest": "Continue as Guest",
  "auth.checkEmail": "Check your email",
  "auth.codeSent": (email: unknown) => `We've sent a code to ${email}`,
  "auth.didntReceive": "Didn't receive a code?",
  "auth.tryAgain": "Try again",
  "auth.verify": "Verify code",
  "auth.verifying": "Verifying…",
  "auth.differentEmail": "Use different email",
  "auth.errorSend": "Failed to send verification code. Please try again.",
  "auth.errorOtp": "The verification code you entered is incorrect.",
  "auth.errorGuest": (m: unknown) => `Failed to sign in as guest: ${m}`,
  "auth.securedBy": "Secured by",

  // Dashboard
  "dash.title": "Dashboard",
  "dash.activeCount": (n: unknown) =>
    `${n} active subscription${n === 1 ? "" : "s"}`,
  "dash.allAmountsIn": (c: unknown) => `all amounts in ${c}`,
  "dash.monthlyRecurring": "Monthly recurring",
  "dash.annualRecurring": "Annual recurring",
  "dash.aYear": (x: unknown) => `≈ ${x} a year`,
  "dash.due7": "Due in the next 7 days",
  "dash.due30": "Next 30 days",
  "dash.paymentsDue": (n: unknown) =>
    `${n} payment${n === 1 ? "" : "s"} due in the next 30 days`,
  "dash.chargesIn30": (x: unknown) => `≈ ${x} in charges`,
  "dash.largestMonthly": "Largest monthly",
  "dash.noSubsYet": "No subscriptions yet",
  "dash.quietWeek": "Nothing renews this week. Enjoy the quiet.",
  "dash.mostExpensive": "Most expensive",
  "dash.byCategory": "Spending by category",
  "dash.keepTitle": "Should I keep this?",
  "dash.keepEmpty":
    "Nothing looks wasteful right now. Fill in the review fields on a subscription to see suggestions here.",
  "dash.noRecordedUse": "No recorded use",
  "dash.costlyRarelyUsed": "Costly but rarely used",
  "dash.unusedFor": (n: unknown) => `Unused for ${n} days`,
  "dash.alternative": (a: unknown) => `Alternative: ${a}`,
  "dash.overlapsWith": (a: unknown) => `Overlaps with ${a}`,
  "dash.enjoyQuiet": "Enjoy the quiet.",

  // Subscriptions list
  "subs.title": "Subscriptions",
  "subs.shown": (n: unknown) => `${n} shown`,
  "subs.searchPlaceholder": "Search by name, payment method, or notes…",
  "subs.sortName": "Name A–Z",
  "subs.sortPriceDesc": "Most expensive first",
  "subs.sortPriceAsc": "Least expensive first",
  "subs.sortNext": "Next billing date",
  "subs.cancelledWithCount": (n: unknown) => `Cancelled (${n})`,
  "subs.noneFound": "No subscriptions found",
  "subs.tryDifferent": "Try a different search or category.",
  "subs.addFirst":
    "Add your first subscription to start tracking your recurring spend.",
  "subs.noAutoRenew": "No auto-renew",
  "subs.actions": "Actions",
  "subs.markUsed": "Mark as used today",
  "subs.markedUsed": (n: unknown) => `Marked ${n} as used today`,
  "subs.restore": "Restore",
  "subs.restored": (n: unknown) => `${n} restored`,
  "subs.movedToHistory": (n: unknown) => `${n} moved to cancellation history`,

  // Detail page
  "detail.backToAll": "All subscriptions",
  "detail.notFound": "Subscription not found",
  "detail.notFoundBody":
    "It may have been removed, or the link is out of date.",
  "detail.backToSubs": "Back to subscriptions",
  "detail.autoRenews": "Auto-renews",
  "detail.manualRenewal": "Manual renewal",
  "detail.details": "Details",
  "detail.price": "Price",
  "detail.billsEvery": "Bills every",
  "detail.nextBilling": "Next billing",
  "detail.paymentMethod": "Payment method",
  "detail.startDate": "Start date",
  "detail.autoRenewal": "Auto renewal",
  "detail.rateOverride": "Exchange rate override",
  "detail.notes": "Notes",
  "detail.usedToday": "Used today",
  "detail.cancelSubscription": "Cancel subscription",
  "detail.cancelTitle": (n: unknown) => `Cancel ${n}?`,
  "detail.cancelBody":
    "Nothing is deleted — it moves to your cancellation history with a record of when and why. You can restore it later.",
  "detail.cancelReasonPlaceholder": "Optional: why are you cancelling?",
  "detail.keepIt": "Keep it",
  "detail.on": "On",
  "detail.off": "Off",
  "detail.cancelledRecord": (d: unknown, r: unknown) =>
    r
      ? `Cancelled on ${d} — ${r}. Its history is kept in the cancellation record.`
      : `Cancelled on ${d}. Its history is kept in the cancellation record.`,
  "detail.perUnit": (n: unknown) => `1 ${n}`,
  "detail.usesRate": (r: unknown) => `= ${r}`,

  // Form dialog
  "form.addTitle": "Add subscription",
  "form.editTitle": "Edit subscription",
  "form.editDesc":
    "Update the details, billing, or review notes for this service.",
  "form.addDesc":
    "Track a recurring service so nothing sneaks up on you.",
  "form.serviceName": "Service name",
  "form.namePlaceholder": "e.g. Netflix",
  "form.category": "Category",
  "form.price": "Price",
  "form.currency": "Currency",
  "form.priceIsPer": "Price is per",
  "form.billsEvery": "Bills every",
  "form.startDate": "Start date",
  "form.nextBillingDate": "Next billing date",
  "form.paymentMethod": "Payment method",
  "form.paymentPlaceholder": "e.g. Visa •• 4417",
  "form.autoRenewal": "Auto renewal",
  "form.exchangeRate": "Exchange rate",
  "form.ratePlaceholder": (c: unknown) => `1 ${c} = ?`,
  "form.rateHelp": (base: unknown, cur: unknown, rate: unknown) =>
    `Leave blank to use your default rate of ${rate} ${base} per ${cur}.`,
  "form.rateHelpNoDefault": (base: unknown, cur: unknown) =>
    `Leave blank to convert 1 ${cur} = 1 ${base} (set a default rate in Manage).`,
  "form.previewMonthly": (x: unknown) => `≈ ${x}/month`,
  "form.previewAnnual": (x: unknown) => `≈ ${x}/year`,
  "form.notes": "Notes",
  "form.notesPlaceholder": "Anything worth remembering about this one.",
  "form.reviewTitle": "Should I keep this?",
  "form.reviewDesc":
    "Optional — helps spot the ones that have quietly outstayed their welcome.",
  "form.howOftenUsed": "How often used",
  "form.personalValue": "Personal value",
  "form.lastUsedDate": "Last used date",
  "form.alternative": "Alternative available",
  "form.alternativePlaceholder": "e.g. Google One covers this",
  "form.cancellationNotes": "Cancellation notes",
  "form.cancellationNotesPlaceholder":
    "What would make you cancel, or what you'd need to check first.",
  "form.saveChanges": "Save changes",
  "form.addSubscription": "Add subscription",
  "form.somethingWrong": "Something went wrong",
  "form.updated": "Subscription updated",
  "form.added": (n: unknown) => `${n} added`,

  // Enum values
  "cycle.monthly": "Month",
  "cycle.annual": "Year",
  "usage.Daily": "Daily",
  "usage.Weekly": "Weekly",
  "usage.Monthly": "Monthly",
  "usage.Rarely": "Rarely",
  "usage.Never": "Never",
  "value.High": "High",
  "value.Medium": "Medium",
  "value.Low": "Low",

  // Categories
  "cat.AI services": "AI services",
  "cat.Cloud storage": "Cloud storage",
  "cat.Streaming": "Streaming",
  "cat.Mobile phone": "Mobile phone",
  "cat.Internet": "Internet",
  "cat.Software": "Software",
  "cat.Insurance": "Insurance",
  "cat.Membership": "Membership",
  "cat.Banking": "Banking",
  "cat.News": "News",
  "cat.Education": "Education",
  "cat.Other": "Other",

  // Year comparison
  "year.title": "Yearly comparison",
  "year.subtitle": (c: unknown) =>
    `How your recurring spend has moved over time, in ${c}.`,
  "year.empty": "Add subscriptions to see your yearly totals here.",
  "year.vsLast": (a: unknown, b: unknown) => `vs ${b}`,
  "year.noChange": "No change",
  "year.vsPrev": (p: unknown) => `% vs previous`.replace("%", ""), // unused helper
  "year.vsPrevPct": (p: unknown) => `${p}% vs previous`,
  "year.spendByYear": "Spend by year",

  // Manage
  "manage.title": "Manage",
  "manage.subtitle":
    "Exchange rates, cancellation history, and account settings.",
  "manage.ratesTitle": "Default exchange rates",
  "manage.ratesBody": (c: unknown) =>
    `How much 1 unit of each currency is worth in your home currency (${c}). You can also set a rate on an individual subscription.`,
  "manage.saveRates": "Save rates",
  "manage.ratesSaved": "Exchange rates saved",
  "manage.rateError": "Could not save rates",
  "manage.historyTitle": "Cancellation history",
  "manage.historyBody":
    "Cancelled subscriptions are never deleted — they're kept here with their full record.",
  "manage.historyEmpty":
    "Nothing cancelled yet. When you cancel a subscription it will appear here.",
  "manage.account": "Account",
  "manage.signedIn": "Signed in",
  "manage.anonymous": "Anonymous guest session",
  "manage.restoreSample": "Restore sample data",
  "manage.sampleRestored": "Sample data restored",
  "manage.sampleNote":
    "Restoring sample data replaces your current list with the starter AI, cloud storage, mobile, and streaming examples.",
  "manage.perUnit": (c: unknown) => `1 ${c} =`,

  // 404
  "notfound.title": "404",
  "notfound.body": "Page Not Found",

  // Toasts
  "toast.currencySet": (c: unknown) => `Home currency set to ${c}`,
  "toast.error": "Something went wrong",
};

const zh: Dict = {
  "nav.dashboard": "仪表板",
  "nav.subscriptions": "订阅",
  "nav.year": "年度",
  "nav.manage": "管理",
  "nav.homeCurrency": "本位币种",
  "nav.signOut": "退出登录",
  "app.name": "订阅管家",

  "common.add": "添加",
  "common.edit": "编辑",
  "common.save": "保存",
  "common.cancel": "取消",
  "common.back": "返回",
  "common.loading": "加载中…",
  "common.today": "今天",
  "common.tomorrow": "明天",
  "common.daysAgo": (n: unknown) => `${n} 天前`,
  "common.inDays": (n: unknown) => `${n} 天后`,
  "common.renewsToday": "今天续费",
  "common.renewsTomorrow": "明天续费",
  "common.renewsOn": (d: unknown) => `${d} 续费`,
  "common.renewalPassed": "已过续费日期",
  "common.perMonth": "每月",
  "common.perMonthShort": "/月",
  "common.perYear": "/年",
  "common.wasPerMonth": (x: unknown) => `原 ${x}/月`,
  "common.cancelledOn": (d: unknown) => `已于 ${d} 取消`,
  "common.cancelled": "已取消",
  "common.notSet": "未设置",
  "common.noneNoted": "未填写",
  "common.optional": "可选",
  "common.all": "全部",
  "common.search": "搜索…",
  "common.sort": "排序",
  "common.year": "年",
  "common.month": "月",
  "common.day": "天",
  "common.days": "天",

  "landing.badge": "给不想再被扣款惊讶的人",
  "landing.heroTitle": "清清楚楚知道订阅花了多少钱",
  "landing.heroBody":
    "把所有订阅服务放在一处管理——每月、每年总支出，即将到来的续费，以及当某项服务不再值得时给你的轻声提醒。",
  "landing.ctaStart": "免费开始使用",
  "landing.ctaHow": "了解它如何运作",
  "landing.noCard": "免费 · 无需信用卡 · 手机上也好用",
  "landing.featuresTitle": "功能齐全，绝无冗余",
  "landing.featuresBody":
    "设计理念很简单：一张清晰、诚实的订阅支出全貌，以及帮你守住钱包的工具。",
  "landing.ctaTitle": "准备好看清全局了吗？",
  "landing.ctaBody": "设置只需几分钟，登录后示例数据即刻就绪。",
  "landing.ctaButton": "创建你的账户",
  "landing.f1.title": "一个真实的月度数字",
  "landing.f1.body":
    "每项订阅都会按你的本位币换算成每月和每年金额，真实总支出一目了然。",
  "landing.f2.title": "续费，提前知道",
  "landing.f2.body":
    "清楚看到未来 7 天和 30 天内哪些服务会续费，不再有悄悄溜走的意外扣款。",
  "landing.f3.title": "该不该续？",
  "landing.f3.body":
    "记录每项服务的实际使用频率。昂贵却很少使用、闲置超过 60 天的订阅都会被标出来。",
  "landing.f4.title": "年度对比",
  "landing.f4.body": "观察历年订阅支出走势，看看它是在悄悄上涨，还是终于开始下降。",
  "landing.f5.title": "所有订阅，一个目录",
  "landing.f5.body":
    "搜索、按分类筛选，点开任意订阅查看完整历史、备注与评估详情。",
  "landing.footerTag": "简单、私密地记录你的每一笔订阅支出。",
  "landing.monthly": "每月",
  "landing.yearly": "每年",
  "landing.due7": "7 天内到期",

  "auth.signIn": "登录",
  "auth.signInToContinue": "登录后继续",
  "auth.onlySignedIn": "此页面仅对已登录用户开放。",
  "auth.returnNote": "登录后将直接返回此页面。",
  "auth.backHome": "返回首页",
  "auth.getStarted": "开始使用",
  "auth.enterEmail": "输入邮箱登录或注册",
  "auth.emailPlaceholder": "name@example.com",
  "auth.or": "或",
  "auth.guest": "以访客身份继续",
  "auth.checkEmail": "查收你的邮箱",
  "auth.codeSent": (email: unknown) => `验证码已发送至 ${email}`,
  "auth.didntReceive": "没有收到验证码？",
  "auth.tryAgain": "重新发送",
  "auth.verify": "验证",
  "auth.verifying": "验证中…",
  "auth.differentEmail": "使用其他邮箱",
  "auth.errorSend": "验证码发送失败，请重试。",
  "auth.errorOtp": "你输入的验证码不正确。",
  "auth.errorGuest": (m: unknown) => `访客登录失败：${m}`,
  "auth.securedBy": "安全技术支持",

  "dash.title": "仪表板",
  "dash.activeCount": (n: unknown) => `${n} 项有效订阅`,
  "dash.allAmountsIn": (c: unknown) => `所有金额以 ${c} 计`,
  "dash.monthlyRecurring": "每月固定支出",
  "dash.annualRecurring": "每年固定支出",
  "dash.aYear": (x: unknown) => `≈ 每年 ${x}`,
  "dash.due7": "未来 7 天内到期",
  "dash.due30": "未来 30 天",
  "dash.paymentsDue": (n: unknown) => `未来 30 天内有 ${n} 笔付款`,
  "dash.chargesIn30": (x: unknown) => `≈ ${x} 扣款`,
  "dash.largestMonthly": "最大月度支出",
  "dash.noSubsYet": "暂无订阅",
  "dash.quietWeek": "本周没有续费。享受宁静。",
  "dash.mostExpensive": "最贵的订阅",
  "dash.byCategory": "按分类支出",
  "dash.keepTitle": "该不该续？",
  "dash.keepEmpty":
    "目前没有发现浪费。在订阅的评估栏里填写使用情况，这里就会出现建议。",
  "dash.noRecordedUse": "没有使用记录",
  "dash.costlyRarelyUsed": "昂贵但很少使用",
  "dash.unusedFor": (n: unknown) => `已闲置 ${n} 天`,
  "dash.alternative": (a: unknown) => `替代方案：${a}`,
  "dash.overlapsWith": (a: unknown) => `与 ${a} 重叠`,
  "dash.enjoyQuiet": "享受宁静。",

  "subs.title": "订阅",
  "subs.shown": (n: unknown) => `共 ${n} 项`,
  "subs.searchPlaceholder": "按名称、支付方式或备注搜索…",
  "subs.sortName": "名称 A–Z",
  "subs.sortPriceDesc": "最贵在前",
  "subs.sortPriceAsc": "最便宜在前",
  "subs.sortNext": "下次扣费日期",
  "subs.cancelledWithCount": (n: unknown) => `已取消（${n}）`,
  "subs.noneFound": "未找到订阅",
  "subs.tryDifferent": "换个搜索词或分类试试。",
  "subs.addFirst": "添加你的第一个订阅，开始追踪固定支出。",
  "subs.noAutoRenew": "不自动续费",
  "subs.actions": "操作",
  "subs.markUsed": "标记今天用过",
  "subs.markedUsed": (n: unknown) => `已标记 ${n} 今天使用`,
  "subs.restore": "恢复",
  "subs.restored": (n: unknown) => `${n} 已恢复`,
  "subs.movedToHistory": (n: unknown) => `${n} 已移入取消记录`,

  "detail.backToAll": "全部订阅",
  "detail.notFound": "未找到该订阅",
  "detail.notFoundBody": "它可能已被删除，或链接已失效。",
  "detail.backToSubs": "返回订阅列表",
  "detail.autoRenews": "自动续费",
  "detail.manualRenewal": "手动续费",
  "detail.details": "详情",
  "detail.price": "价格",
  "detail.billsEvery": "扣费周期",
  "detail.nextBilling": "下次扣费",
  "detail.paymentMethod": "支付方式",
  "detail.startDate": "开始日期",
  "detail.autoRenewal": "自动续费",
  "detail.rateOverride": "自定义汇率",
  "detail.notes": "备注",
  "detail.usedToday": "今天用过",
  "detail.cancelSubscription": "取消订阅",
  "detail.cancelTitle": (n: unknown) => `取消 ${n}？`,
  "detail.cancelBody":
    "不会删除任何数据——它会连同时间和原因一起移入取消记录，之后可以恢复。",
  "detail.cancelReasonPlaceholder": "可选：为什么取消？",
  "detail.keepIt": "先留着",
  "detail.on": "开",
  "detail.off": "关",
  "detail.cancelledRecord": (d: unknown, r: unknown) =>
    r
      ? `已于 ${d} 取消 —— ${r}。完整记录保留在取消记录中。`
      : `已于 ${d} 取消。完整记录保留在取消记录中。`,
  "detail.perUnit": (n: unknown) => `1 ${n}`,
  "detail.usesRate": (r: unknown) => `= ${r}`,

  "form.addTitle": "添加订阅",
  "form.editTitle": "编辑订阅",
  "form.editDesc": "更新此服务的详情、扣费或评估备注。",
  "form.addDesc": "记录一个周期性服务，别让它悄悄扣款。",
  "form.serviceName": "服务名称",
  "form.namePlaceholder": "例如：Netflix",
  "form.category": "分类",
  "form.price": "价格",
  "form.currency": "币种",
  "form.priceIsPer": "价格周期",
  "form.billsEvery": "扣费间隔",
  "form.startDate": "开始日期",
  "form.nextBillingDate": "下次扣费日期",
  "form.paymentMethod": "支付方式",
  "form.paymentPlaceholder": "例如：招行 •• 4417",
  "form.autoRenewal": "自动续费",
  "form.exchangeRate": "汇率",
  "form.ratePlaceholder": (c: unknown) => `1 ${c} = ?`,
  "form.rateHelp": (base: unknown, cur: unknown, rate: unknown) =>
    `留空则使用默认汇率：1 ${cur} = ${rate} ${base}。`,
  "form.rateHelpNoDefault": (base: unknown, cur: unknown) =>
    `留空则按 1 ${cur} = 1 ${base} 换算（可在“管理”页设置默认汇率）。`,
  "form.previewMonthly": (x: unknown) => `≈ ${x}/月`,
  "form.previewAnnual": (x: unknown) => `≈ ${x}/年`,
  "form.notes": "备注",
  "form.notesPlaceholder": "关于这项服务的任何值得记下来的事。",
  "form.reviewTitle": "该不该续？",
  "form.reviewDesc": "可选——帮你发现那些早已不再值得的服务。",
  "form.howOftenUsed": "使用频率",
  "form.personalValue": "个人价值",
  "form.lastUsedDate": "最后使用日期",
  "form.alternative": "可用替代品",
  "form.alternativePlaceholder": "例如：Google One 已覆盖",
  "form.cancellationNotes": "取消备注",
  "form.cancellationNotesPlaceholder": "什么情况会让你取消，或者取消前需要确认什么。",
  "form.saveChanges": "保存修改",
  "form.addSubscription": "添加订阅",
  "form.somethingWrong": "出了点问题",
  "form.updated": "订阅已更新",
  "form.added": (n: unknown) => `${n} 已添加`,

  "cycle.monthly": "月",
  "cycle.annual": "年",
  "usage.Daily": "每天",
  "usage.Weekly": "每周",
  "usage.Monthly": "每月",
  "usage.Rarely": "很少",
  "usage.Never": "从未",
  "value.High": "高",
  "value.Medium": "中",
  "value.Low": "低",

  "cat.AI services": "AI 服务",
  "cat.Cloud storage": "云存储",
  "cat.Streaming": "流媒体",
  "cat.Mobile phone": "手机",
  "cat.Internet": "宽带",
  "cat.Software": "软件",
  "cat.Insurance": "保险",
  "cat.Membership": "会员",
  "cat.Banking": "银行",
  "cat.News": "新闻",
  "cat.Education": "教育",
  "cat.Other": "其他",

  "year.title": "年度对比",
  "year.subtitle": (c: unknown) => `以 ${c} 计的历年订阅支出走势。`,
  "year.empty": "添加订阅后，这里会显示历年总支出。",
  "year.vsLast": (a: unknown, b: unknown) => `对比 ${b}`,
  "year.noChange": "没有变化",
  "year.vsPrev": (p: unknown) => `较上一年`,
  "year.vsPrevPct": (p: unknown) => `较上一年 ${p}%`,
  "year.spendByYear": "逐年支出",

  "manage.title": "管理",
  "manage.subtitle": "汇率、取消记录与账户设置。",
  "manage.ratesTitle": "默认汇率",
  "manage.ratesBody": (c: unknown) =>
    `每种货币 1 单位兑换你本位币（${c}）的金额。也可以在单个订阅上单独设置汇率。`,
  "manage.saveRates": "保存汇率",
  "manage.ratesSaved": "汇率已保存",
  "manage.rateError": "汇率保存失败",
  "manage.historyTitle": "取消记录",
  "manage.historyBody": "已取消的订阅不会被删除——完整记录保留在此。",
  "manage.historyEmpty": "还没有取消记录。取消订阅后会出现在这里。",
  "manage.account": "账户",
  "manage.signedIn": "已登录",
  "manage.anonymous": "匿名访客会话",
  "manage.restoreSample": "恢复示例数据",
  "manage.sampleRestored": "示例数据已恢复",
  "manage.sampleNote":
    "恢复示例数据会用初始的 AI、云存储、手机和流媒体示例替换你当前的列表。",
  "manage.perUnit": (c: unknown) => `1 ${c} =`,

  "notfound.title": "404",
  "notfound.body": "页面未找到",

  "toast.currencySet": (c: unknown) => `本位币种已设为 ${c}`,
  "toast.error": "出了点问题",
};

const DICTS: Record<Locale, Dict> = { en, "zh-CN": zh };

// ---------- context ----------

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, ...args: unknown[]) => string;
  /** Locale-aware date formatter for yyyy-mm-dd strings */
  formatDate: (iso: string | undefined) => string;
  /** Locale-aware money formatter (amount, currencyCode) */
  formatMoney: (value: number, currency: string) => string;
  /** Locale-aware number formatter */
  formatNumber: (value: number, opts?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

const BCP47: Record<Locale, string> = { en: "en-NZ", "zh-CN": "zh-CN" };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, ...args: unknown[]) => {
      const entry = DICTS[locale][key] ?? DICTS.en[key] ?? key;
      if (typeof entry === "function") {
        return (entry as (...a: unknown[]) => string)(...args);
      }
      return entry;
    },
    [locale],
  );

  const formatDate = useCallback(
    (iso: string | undefined) => {
      if (!iso) return "—";
      const d = new Date(`${iso}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(BCP47[locale], {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    },
    [locale],
  );

  const formatMoney = useCallback(
    (value: number, currency: string) => {
      try {
        return new Intl.NumberFormat(BCP47[locale], {
          style: "currency",
          currency,
          maximumFractionDigits: value >= 1000 ? 0 : 2,
        }).format(value);
      } catch {
        return `${value.toFixed(2)} ${currency}`;
      }
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, opts?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(BCP47[locale], opts).format(value),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, formatDate, formatMoney, formatNumber }),
    [locale, setLocale, t, formatDate, formatMoney, formatNumber],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** 中文 | English toggle shown in headers. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      className={`flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs font-medium ${className}`}
      role="group"
      aria-label="Language / 语言"
    >
      <button
        onClick={() => setLocale("zh-CN")}
        className={`rounded px-2 py-1 transition-colors ${
          locale === "zh-CN"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        中文
      </button>
      <span className="text-border">|</span>
      <button
        onClick={() => setLocale("en")}
        className={`rounded px-2 py-1 transition-colors ${
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        English
      </button>
    </div>
  );
}
