import { createUploadthing, type FileRouter } from "uploadthing/next";
import { verifyAdminToken } from "@/lib/auth-jwt";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      const token = req.cookies.get("admin_token")?.value;
      const admin = token ? await verifyAdminToken(token) : null;
      if (!admin) {
        throw new Error("Unauthorized");
      }
      return { adminId: admin.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
