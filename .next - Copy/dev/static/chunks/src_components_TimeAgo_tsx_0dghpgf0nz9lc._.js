(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/TimeAgo.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TimeAgo",
    ()=>TimeAgo,
    "formatRelative",
    ()=>formatRelative
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
    _s();
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribe, {
        "TimeAgo.useSyncExternalStore[label]": ()=>formatRelative(new Date(iso))
    }["TimeAgo.useSyncExternalStore[label]"], {
        "TimeAgo.useSyncExternalStore[label]": ()=>new Date(iso).toISOString().slice(0, 10)
    }["TimeAgo.useSyncExternalStore[label]"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("time", {
        dateTime: iso,
        title: new Date(iso).toUTCString(),
        children: label
    }, void 0, false, {
        fileName: "[project]/src/components/TimeAgo.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_s(TimeAgo, "LDjUr0ekzuF6vuGdUMrTi8oZXew=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"]
    ];
});
_c = TimeAgo;
var _c;
__turbopack_context__.k.register(_c, "TimeAgo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_TimeAgo_tsx_0dghpgf0nz9lc._.js.map