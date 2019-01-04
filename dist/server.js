"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./Routes/app");
const PORT = 3000;
app_1.default.listen(PORT, () => {
    console.log("Servers up and running at PORT : " + PORT);
});
//# sourceMappingURL=server.js.map