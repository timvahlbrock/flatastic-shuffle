import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "@oeffis/location-analyzer",
            formats: ["umd"]
        },
        target: "esnext",
        rollupOptions: {
            external: ["events", "readline"]
        }
    }
});
