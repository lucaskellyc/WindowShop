import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Remove this line if not using React

export default defineConfig({
  plugins: [react()], // Remove this if not using React
  base: "/WindowShop/",
});
