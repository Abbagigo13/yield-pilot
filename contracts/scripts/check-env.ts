import "dotenv/config";

console.log("RH_RPC_URL:", process.env.RH_RPC_URL || "(NOT SET)");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? `${process.env.PRIVATE_KEY.slice(0, 10)}...` : "(NOT SET)");