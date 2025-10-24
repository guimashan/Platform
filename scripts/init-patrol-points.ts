// 初始化巡邏點（含 GPS 座標）
import { checkinAdminDb } from "../src/lib/admin-checkin";

const patrolPoints = [
  {
    id: "point-yuji",
    name: "玉旨牌",
    qr: "PATROL_YUJI",
    lat: 25.147924, // 龜馬山玉旨牌實際座標（需更新為真實座標）
    lng: 121.410296,
    tolerance: 50, // 50 公尺容許誤差
    active: true,
  },
  {
    id: "point-wanying",
    name: "萬應公",
    qr: "PATROL_WANYING",
    lat: 25.148124, // 萬應公實際座標（需更新為真實座標）
    lng: 121.410496,
    tolerance: 50,
    active: true,
  },
  {
    id: "point-office",
    name: "辦公室",
    qr: "PATROL_OFFICE",
    lat: 25.147724, // 辦公室實際座標（需更新為真實座標）
    lng: 121.410096,
    tolerance: 30, // 辦公室容許誤差較小
    active: true,
  },
];

async function initPatrolPoints() {
  console.log("🚀 開始初始化巡邏點（含 GPS 座標）...");

  try {
    const db = checkinAdminDb();
    const batch = db.batch();

    for (const point of patrolPoints) {
      const ref = db.collection("points").doc(point.id);
      const doc = await ref.get();

      if (doc.exists) {
        // 更新現有巡邏點（加入 GPS 座標）
        batch.update(ref, {
          ...point,
          updatedAt: new Date(),
        });
        console.log(`✅ 更新巡邏點: ${point.name} (${point.id}) - GPS: ${point.lat}, ${point.lng}`);
      } else {
        // 建立新巡邏點
        batch.set(ref, {
          ...point,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ 建立巡邏點: ${point.name} (${point.id}) - GPS: ${point.lat}, ${point.lng}`);
      }
    }

    await batch.commit();
    console.log("✅ 巡邏點初始化完成！");
    console.log("\n⚠️  請注意：GPS 座標為示例值，請更新為實際座標！");
  } catch (error) {
    console.error("❌ 初始化失敗:", error);
    process.exit(1);
  }
}

initPatrolPoints()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
