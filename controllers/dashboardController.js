import connectDB, { sql } from "../lib/db";

const getDashboardSummary = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS OrdersToday,
      SUM(CASE
        WHEN COALESCE(o.COMP_FLAG, 0) = 1 OR o.COMP_CODE IS NOT NULL THEN 0
        ELSE 1
      END) AS CenterOrdersToday,
      SUM(CASE
        WHEN COALESCE(o.COMP_FLAG, 0) = 1 OR o.COMP_CODE IS NOT NULL THEN 1
        ELSE 0
      END) AS ExternalOrdersToday,
      COUNT(DISTINCT CASE
        WHEN COALESCE(o.COMP_FLAG, 0) = 1 OR o.COMP_CODE IS NOT NULL THEN o.COMP_CODE
      END) AS ExternalHospitalsToday,
      SUM(COALESCE(NULLIF(ps.C_FINAL_TOTAL, 0), o.D_TOTAL_VOLUME * o.PES_WEIGHT, 0)) AS TotalVolumeToday
    FROM dbo.PRESCRIBE_ORDER o
    LEFT JOIN dbo.PERFUSION_SHEET ps
      ON ps.REQUEST_NO = o.REQUEST_NO
    WHERE o.REQUEST_DATE >= CAST(GETDATE() AS date)
      AND o.REQUEST_DATE < DATEADD(day, 1, CAST(GETDATE() AS date));
  `);

  const summary = result.recordset[0] || {};
  return {
    ordersToday: Number(summary.OrdersToday || 0),
    centerOrdersToday: Number(summary.CenterOrdersToday || 0),
    externalOrdersToday: Number(summary.ExternalOrdersToday || 0),
    externalHospitalsToday: Number(summary.ExternalHospitalsToday || 0),
    totalVolumeToday: Number(summary.TotalVolumeToday || 0),
  };
};

const getTodayPrescribeOrders = async (limit = 10) => {
  const pool = await connectDB();
  const safeLimit = Math.max(1, Math.min(50, Number.parseInt(limit, 10) || 10));
  const result = await pool.request()
    .input("Limit", sql.Int, safeLimit)
    .query(`
      SELECT TOP (@Limit)
        o.PRESCRIBE_ORDER_ID,
        o.REQUEST_NO,
        o.REQUEST_DATE,
        o.PES_NAME,
        o.PES_WEIGHT,
        o.D_TOTAL_VOLUME,
        o.COMP_FLAG,
        o.COMP_CODE,
        CASE
          WHEN o.COMP_CODE IS NOT NULL THEN COALESCE(c.COMP_NAME, N'External hospital')
          WHEN COALESCE(o.COMP_FLAG, 0) = 1 THEN N'External hospital'
          ELSE N'Center hospital'
        END AS HospitalName,
        COALESCE(NULLIF(ps.C_FINAL_TOTAL, 0), o.D_TOTAL_VOLUME * o.PES_WEIGHT, 0) AS VolumeToPrepare
      FROM dbo.PRESCRIBE_ORDER o
      LEFT JOIN dbo.Company c
        ON c.COMP_CODE = o.COMP_CODE
      LEFT JOIN dbo.PERFUSION_SHEET ps
        ON ps.REQUEST_NO = o.REQUEST_NO
      WHERE o.REQUEST_DATE >= CAST(GETDATE() AS date)
        AND o.REQUEST_DATE < DATEADD(day, 1, CAST(GETDATE() AS date))
      ORDER BY o.REQUEST_DATE DESC, o.PRESCRIBE_ORDER_ID DESC;
    `);

  return result.recordset.map((order) => ({
    ...order,
    PRESCRIBE_ORDER_ID: String(order.PRESCRIBE_ORDER_ID),
    REQUEST_NO: order.REQUEST_NO == null ? null : String(order.REQUEST_NO),
    IsExternal: Boolean(order.COMP_FLAG) || (order.COMP_CODE !== null && order.COMP_CODE !== undefined),
  }));
};

const getHospitalDemandToday = async (limit = 8) => {
  const pool = await connectDB();
  const safeLimit = Math.max(1, Math.min(30, Number.parseInt(limit, 10) || 8));
  const result = await pool.request()
    .input("Limit", sql.Int, safeLimit)
    .query(`
      SELECT TOP (@Limit)
        o.COMP_CODE,
        CASE
          WHEN o.COMP_CODE IS NULL THEN N'External hospital'
          ELSE COALESCE(c.COMP_NAME, CONCAT(N'Hospital ', CONVERT(nvarchar(10), o.COMP_CODE)))
        END AS HospitalName,
        COUNT(*) AS OrdersToday,
        SUM(COALESCE(NULLIF(ps.C_FINAL_TOTAL, 0), o.D_TOTAL_VOLUME * o.PES_WEIGHT, 0)) AS VolumeToday
      FROM dbo.PRESCRIBE_ORDER o
      LEFT JOIN dbo.Company c
        ON c.COMP_CODE = o.COMP_CODE
      LEFT JOIN dbo.PERFUSION_SHEET ps
        ON ps.REQUEST_NO = o.REQUEST_NO
      WHERE o.REQUEST_DATE >= CAST(GETDATE() AS date)
        AND o.REQUEST_DATE < DATEADD(day, 1, CAST(GETDATE() AS date))
        AND (COALESCE(o.COMP_FLAG, 0) = 1 OR o.COMP_CODE IS NOT NULL)
      GROUP BY o.COMP_CODE, c.COMP_NAME
      ORDER BY COUNT(*) DESC, VolumeToday DESC, HospitalName ASC;
    `);

  return result.recordset.map((hospital) => ({
    ...hospital,
    OrdersToday: Number(hospital.OrdersToday || 0),
    VolumeToday: Number(hospital.VolumeToday || 0),
  }));
};

export { getDashboardSummary, getTodayPrescribeOrders, getHospitalDemandToday };
