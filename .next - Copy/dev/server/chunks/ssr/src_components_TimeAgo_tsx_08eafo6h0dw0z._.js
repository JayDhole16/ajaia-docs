module.exports = [
"[project]/src/components/TimeAgo.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TimeAgo",
    ()=>TimeAgo,
    "formatRelative",
    ()=>formatRelative
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto"
});
const STEPS = [
    [
        "second",
        60
    ],
    [
        "minute",
        60
    ],
    [
        "hour",
        24
    ],
    [
        "day",
        7
    ],
    [
        "week",
        4.35
    ],
    [
        "month",
        12
    ],
    [
        "year",
        Infinity
    ]
];
function formatRelative(date, now = Date.now()) {
    let value = (date.getTime() - now) / 1000;
    for (const [unit, size] of STEPS){
        if (Math.abs(value) < size) {
            return unit === "second" && Math.abs(value) < 45 ? "just now" : rtf.format(Math.round(value), unit);
        }
        value /= size;
    }
    return date.toLocaleDateString();
}
const subscribe = ()=>()=>{};
function TimeAgo({ iso }) {
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribe, ()=>formatRelative(new Date(iso)), ()=>new Date(iso).toISOString().slice(0, 10));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("time", {
        dateTime: iso,
        title: new Date(iso).toUTCString(),
        children: label
    }, void 0, false, {
        fileName: "[project]/src/components/TimeAgo.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_components_TimeAgo_tsx_08eafo6h0dw0z._.js.map