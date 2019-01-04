import app from "./Routes/app";

const PORT = 5000;

app.listen(PORT, () => {
    console.log("Servers up and running at PORT : " + PORT);
})