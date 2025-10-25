import NextAuth from "next-auth";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";

// LINE Provider 配置
const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "line",
      name: "LINE",
      type: "oauth",
      wellKnown: "https://access.line.me/.well-known/openid-configuration",
      authorization: {
        url: "https://access.line.me/oauth2/v2.1/authorize",
        params: {
          scope: "profile openid email",
          prompt: "consent",
        },
      },
      token: "https://api.line.me/oauth2/v2.1/token",
      userinfo: "https://api.line.me/v2/profile",
      clientId: process.env.LINE_CHANNEL_ID,
      clientSecret: process.env.LINE_CHANNEL_SECRET,
      profile(profile) {
        return {
          id: profile.userId || profile.sub,
          name: profile.displayName || profile.name,
          email: profile.email || `${profile.userId}@line.local`,
          image: profile.pictureUrl || profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('🔐 NextAuth signIn callback:', {
          userId: user.id,
          email: user.email,
          provider: account?.provider
        });

        // 在 Firebase platform-bc783 建立或更新使用者
        const userRef = platformAdminDb().collection("users").doc(user.id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          // 第一次登入，建立使用者記錄
          await userRef.set({
            lineUserId: user.id,
            email: user.email || `${user.id}@line.local`,
            displayName: user.name || "使用者",
            pictureUrl: user.image || null,
            roles: {},
            createdAt: new Date(),
            lastLoginAt: new Date(),
            hasPassword: false,
          });
          console.log('✅ 新使用者已建立:', user.id);
        } else {
          // 更新最後登入時間
          await userRef.update({
            lastLoginAt: new Date(),
            displayName: user.name || userDoc.data()?.displayName,
            pictureUrl: user.image || userDoc.data()?.pictureUrl,
          });
          console.log('✅ 使用者資料已更新:', user.id);
        }

        return true;
      } catch (error) {
        console.error('❌ signIn callback error:', error);
        return false;
      }
    },
    
    async jwt({ token, user, account }) {
      // 初次登入時，將 user id 存入 token
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    
    async session({ session, token }: { session: Session; token: JWT }) {
      // 將 uid 傳遞到 session
      if (token.uid) {
        session.user = {
          ...session.user,
          id: token.uid as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },
  secret: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
