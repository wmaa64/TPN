import {
  createSession,
  getSessionById,
  getSessionsByPatient,
  getTodaySessionByPatient,
  updateSession,
} from "../../../../controllers/sessionController";

export default async function handler(req, res) {

  // =====================================================
  // GET
  // =====================================================

  if (req.method === "GET") {

    try {

      const {
        patientID,
        date,
        id,
      } = req.query;


      // -----------------------------------------------
      // GET ONE SESSION BY SESSION ID
      // -----------------------------------------------

      if (id) {

        const session =
          await getSessionById(id);


        if (!session) {

          return res.status(404).json({
            message: "Session not found",
          });

        }


        return res.status(200).json(
          session
        );

      }


      // -----------------------------------------------
      // GET TODAY'S SESSION FOR PATIENT
      // -----------------------------------------------

      if (patientID && date) {

        const session =
          await getTodaySessionByPatient(
            patientID,
            date
          );


        return res.status(200).json(
          session
        );

      }


      // -----------------------------------------------
      // GET ALL SESSIONS FOR PATIENT
      // -----------------------------------------------

      if (patientID) {

        const sessions =
          await getSessionsByPatient(
            patientID
          );


        return res.status(200).json(
          sessions
        );

      }


      return res.status(400).json({
        message:
          "PatientID is required",
      });

    }

    catch (error) {

      console.error(
        "GET sessions error:",
        error
      );


      return res.status(500).json({
        message:
          "Failed to load sessions",
      });

    }

  }


  // =====================================================
  // POST
  // =====================================================

  if (req.method === "POST") {

    try {

      const {
        PatientID,
        SessionDate,
        AreaID,
        DeviceID,
        Notes,
        UserID,
      } = req.body;


      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!PatientID) {

        return res.status(400).json({
          message:
            "PatientID is required",
        });

      }


      if (!AreaID) {

        return res.status(400).json({
          message:
            "AreaID is required",
        });

      }


      if (!DeviceID) {

        return res.status(400).json({
          message:
            "DeviceID is required",
        });

      }


      if (!UserID) {

        return res.status(400).json({
          message:
            "UserID is required",
        });

      }


      // -----------------------------------------------
      // CREATE SESSION
      // -----------------------------------------------

      const session =
        await createSession({

          PatientID:
            Number(PatientID),

          SessionDate:
            SessionDate || null,

          AreaID:
            Number(AreaID),

          DeviceID:
            Number(DeviceID),

          Notes:
            Notes || null,

          UserID:
            Number(UserID),

          // Legacy compatibility
          PlanID:
            null,

        });


      if (!session) {

        return res.status(500).json({
          message:
            "Failed to create session",
        });

      }


      return res.status(201).json(
        session
      );

    }

    catch (error) {

      console.error(
        "POST session error:",
        error
      );


      return res.status(500).json({
        message:
          "Failed to create session",

        error:
          error.message,
      });

    }

  }

// =====================================================
// PUT
// UPDATE SESSION
// =====================================================

if (req.method === "PUT") {

  try {

    const {
      SessionID,
      PatientID,
      SessionDate,
      AreaID,
      DeviceID,
      Notes,
      UserID,
    } = req.body;


    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!SessionID) {

      return res.status(400).json({
        message:
          "SessionID is required",
      });

    }


    if (!PatientID) {

      return res.status(400).json({
        message:
          "PatientID is required",
      });

    }


    if (!AreaID) {

      return res.status(400).json({
        message:
          "AreaID is required",
      });

    }


    if (!DeviceID) {

      return res.status(400).json({
        message:
          "DeviceID is required",
      });

    }


    if (!UserID) {

      return res.status(400).json({
        message:
          "UserID is required",
      });

    }


    // -----------------------------------------------
    // UPDATE SESSION
    // -----------------------------------------------

    const session =   await updateSession(SessionID,
        {
          PatientID: Number(PatientID),

          SessionDate:  SessionDate || null,

          AreaID: Number(AreaID),

          DeviceID:  Number(DeviceID),

          Notes:  Notes || null,

          UserID: Number(UserID),

          // Legacy compatibility
          PlanID:  null,
        }
      );


    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }


    return res.status(200).json(session);

  }

  catch (error) {

    console.error(
      "PUT session error:",
      error
    );


    return res.status(500).json({
      message:
        "Failed to update session",

      error:
        error.message,
    });

  }

}

  // =====================================================
  // METHOD NOT ALLOWED
  // =====================================================

  res.setHeader(
    "Allow",
    ["GET", "POST","PUT"]
  );


  return res.status(405).json({
    message:
      `Method ${req.method} not allowed`,
  });

}