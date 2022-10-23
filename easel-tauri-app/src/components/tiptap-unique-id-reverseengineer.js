var M = Object.defineProperty,
    P = Object.defineProperties;
var k = Object.getOwnPropertyDescriptors;
var E = Object.getOwnPropertySymbols;
var q = Object.prototype.hasOwnProperty,
    x = Object.prototype.propertyIsEnumerable;
var I = (e, n, t) => n in e ? M(e, n, {
        enumerable: !0,
        configurable: !0,
        writable: !0,
        value: t
    }) : e[n] = t,
    f = (e, n) => {
        for (var t in n || (n = {})) q.call(n, t) && I(e, t, n[t]);
        if (E)
            for (var t of E(n)) x.call(n, t) && I(e, t, n[t]);
        return e
    },
    m = (e, n) => P(e, k(n));
import {
    E as C,
    ah as O,
    p as A,
    P as L,
    a8 as j,
    a9 as H,
    aa as R,
    S,
    q as U
} from "./vendor.d8bd8103.js";
import {
    v as W
} from "./v4.a95b4bcb.js";

function $(e, n = JSON.stringify) {
    const t = {};
    return e.filter(a => {
        const s = n(a);
        return Object.prototype.hasOwnProperty.call(t, s) ? !1 : t[s] = !0
    })
}

function F(e) {
    const n = e.filter((a, s) => e.indexOf(a) !== s);
    return $(n)
}
// https://tiptap.dev/guide/custom-extensions#priority

const G = C.create({
    name: "uniqueID",
    priority: 1e4,
    addOptions() {
        return {
            attributeName: "id",
            types: [],
            generateID: () => W(),
            filterTransaction: null
        }
    },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                [this.options.attributeName]: {
                    default: null,
                    parseHTML: e => e.getAttribute(`data-${this.options.attributeName}`),
                    renderHTML: e => e[this.options.attributeName] ? {
                        [`data-${this.options.attributeName}`]: e[this.options.attributeName]
                    } : {}
                }
            }
        }]
    },
    onCreate() {
        if (this.editor.extensionManager.extensions.find(r => r.name === "collaboration")) return;
        const {
            view: e,
            state: n
        } = this.editor, {
            tr: t,
            doc: a
        } = n, {
            types: s,
            attributeName: o,
            generateID: c
        } = this.options;
        O(a, r => s.includes(r.type.name) && r.attrs[o] === null).forEach(({
            node: r,
            pos: u
        }) => {
            t.setNodeMarkup(u, void 0, m(f({}, r.attrs), {
                [o]: c()
            }))
        }), t.setMeta("addToHistory", !1), e.dispatch(t)
    },
    addProseMirrorPlugins() {
        let e = null,
            n = !1;
        return [new A({
            key: new L("uniqueID"),
            appendTransaction: (t, a, s) => {
                const o = t.some(l => l.docChanged) && !a.doc.eq(s.doc),
                    c = this.options.filterTransaction && t.some(l => {
                        var p, h;
                        return !((h = (p = this.options).filterTransaction) == null ? void 0 : h.call(p, l))
                    });
                if (!o || c) return;
                const {
                    tr: i
                } = s, {
                    types: r,
                    attributeName: u,
                    generateID: y
                } = this.options, b = j(a.doc, t), {
                    mapping: w
                } = b;
                if (H(b).forEach(({
                        newRange: l
                    }) => {
                        const p = R(s.doc, l, d => r.includes(d.type.name)),
                            h = p.map(({
                                node: d
                            }) => d.attrs[u]).filter(d => d !== null),
                            D = F(h);
                        p.forEach(({
                            node: d,
                            pos: g
                        }) => {
                            var v;
                            const N = (v = i.doc.nodeAt(g)) == null ? void 0 : v.attrs[u];
                            if (N === null) {
                                i.setNodeMarkup(g, void 0, m(f({}, d.attrs), {
                                    [u]: y()
                                }));
                                return
                            }
                            const {
                                deleted: T
                            } = w.invert().mapResult(g);
                            T && D.includes(N) && i.setNodeMarkup(g, void 0, m(f({}, d.attrs), {
                                [u]: y()
                            }))
                        })
                    }), !!i.steps.length) return i
            },
            view(t) {
                const a = s => {
                    var o;
                    e = ((o = t.dom.parentElement) == null ? void 0 : o.contains(s.target)) ? t.dom.parentElement : null
                };
                return window.addEventListener("dragstart", a), {
                    destroy() {
                        window.removeEventListener("dragstart", a)
                    }
                }
            },
            props: {
                handleDOMEvents: {
                    drop: (t, a) => {
                        var s;
                        return (e !== t.dom.parentElement || ((s = a.dataTransfer) == null ? void 0 : s.effectAllowed) === "copy") && (e = null, n = !0), !1
                    },
                    paste: () => (n = !0, !1)
                },
                transformPasted: t => {
                    if (!n) return t;
                    const {
                        types: a,
                        attributeName: s
                    } = this.options, o = c => {
                        const i = [];
                        return c.forEach(r => {
                            if (r.isText) {
                                i.push(r);
                                return
                            }
                            if (!a.includes(r.type.name)) {
                                i.push(r.copy(o(r.content)));
                                return
                            }
                            const u = r.type.create(m(f({}, r.attrs), {
                                [s]: null
                            }), o(r.content), r.marks);
                            i.push(u)
                        }), U.from(i)
                    };
                    return n = !1, new S(o(t.content), t.openStart, t.openEnd)
                }
            }
        })]
    }
});
var V = G;
export {
    V as U
};