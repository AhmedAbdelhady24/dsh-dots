window.__ModuleLoader__.load({
  id: "dsh-client-ui-dots",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const jsx = require("react/jsx-runtime");
    function DotsPanel() {
      return jsx.jsx("div", { style: { padding: "16px" }, children: "Dots panel — use /dot commands in chat to create and run dots." });
    }
    function apply(ctx) {
      ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
        name: "sidebar.panellist",
        id: "dots",
        order: 100,
        label: "Dots",
      }, DotsPanel));
    }
    exports.apply = apply;
    return module.exports;
  },
});
