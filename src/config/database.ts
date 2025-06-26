import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const { MONGO_URI } = process.env;

export const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI não está definida");
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB!");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
};