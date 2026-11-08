import { useEffect, useState } from "react";

// ==========================================================
// INITIAL FORM
// ==========================================================

const emptyForm = {
  UserName: "",
  FullName: "",
  Password: "",
  RoleID: "",
  IsActive: true,
};


const Users = () => {

  // ========================================================
  // USERS
  // ========================================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [hasSearched, setHasSearched] = useState(false);


  // ========================================================
  // ROLES
  // ========================================================

  const [roles, setRoles] = useState([]);

  const [rolesLoading, setRolesLoading] = useState(false);


  // ========================================================
  // FORM / MODAL
  // ========================================================

  const [showForm, setShowForm] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  const [saving, setSaving] = useState(false);


  // ========================================================
  // LOAD ROLES
  // ========================================================

  useEffect(() => {

    const fetchRoles = async () => {

      try {

        setRolesLoading(true);

        const response = await fetch(
          "/api/roles"
        );

        const data = await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load roles"
          );

        }

        setRoles(data);

      } catch (error) {

        console.error(
          "Error loading roles:",
          error
        );

        setError(
          error.message ||
          "Unable to load roles."
        );

      } finally {

        setRolesLoading(false);

      }

    };


    fetchRoles();

  }, []);


  // ========================================================
  // SEARCH USERS
  // ========================================================

  const searchUsers = async () => {

    const searchValue =
      search.trim();


    if (!searchValue) {

      setUsers([]);

      setHasSearched(false);

      return;
    }


    try {

      setLoading(true);

      setError("");


      const response = await fetch(
        `/api/users?search=${encodeURIComponent(
          searchValue
        )}`
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to search users"
        );

      }


      setUsers(data);

      setHasSearched(true);


    } catch (error) {

      console.error(
        "Search users error:",
        error
      );

      setError(
        error.message ||
        "Unable to search users."
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================================
  // OPEN ADD USER FORM
  // ========================================================

  const handleAddUser = () => {

    setEditingUser(null);

    setFormData({
      ...emptyForm,
    });

    setShowForm(true);

  };


  // ========================================================
  // OPEN EDIT USER FORM
  // ========================================================

  const handleEditUser = (user) => {

    setEditingUser(user);


    setFormData({

      UserName:
        user.UserName || "",

      FullName:
        user.FullName || "",

      // Do NOT load PasswordHash
      Password: "",

      RoleID:
        user.RoleID ?? "",

      IsActive:
        user.IsActive ?? true,

    });


    setShowForm(true);

  };


  // ========================================================
  // CLOSE FORM
  // ========================================================

  const handleCloseForm = () => {

    if (saving) {
      return;
    }


    setShowForm(false);

    setEditingUser(null);

    setFormData({
      ...emptyForm,
    });

  };


  // ========================================================
  // HANDLE FORM INPUT
  // ========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setFormData((current) => ({

      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));

  };


  // ========================================================
  // SAVE / UPDATE USER
  // ========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    // ------------------------------------------------------
    // BASIC VALIDATION
    // ------------------------------------------------------

    if (
      !formData.UserName ||
      !formData.UserName.trim()
    ) {

      alert(
        "Please enter the username."
      );

      return;
    }


    if (
      !formData.FullName ||
      !formData.FullName.trim()
    ) {

      alert(
        "Please enter the full name."
      );

      return;
    }


    if (!formData.RoleID) {

      alert(
        "Please select a role."
      );

      return;
    }


    // Password is required only for NEW user

    if (
      !editingUser &&
      !formData.Password
    ) {

      alert(
        "Please enter a password."
      );

      return;
    }


    try {

      setSaving(true);


      // ====================================================
      // UPDATE EXISTING USER
      // ====================================================

      if (editingUser) {

        const response =
          await fetch(
            `/api/users/${editingUser.UserID}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({

                UserName:
                  formData.UserName,

                FullName:
                  formData.FullName,

                RoleID:
                  Number(formData.RoleID),

                IsActive:
                  formData.IsActive,

                // Only send Password
                // if user entered a new one

                ...(formData.Password
                  ? {
                      Password:
                        formData.Password,
                    }
                  : {}),

              }),

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to update user"
          );

        }


        // --------------------------------------------------
        // UPDATE USER IN CURRENT LIST
        // --------------------------------------------------

        setUsers(
          (currentUsers) =>
            currentUsers.map(
              (user) =>
                user.UserID ===
                data.UserID
                  ? data
                  : user
            )
        );


        handleCloseForm();

      }


      // ====================================================
      // CREATE NEW USER
      // ====================================================

      else {

        const response =
          await fetch(
            "/api/users",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({

                UserName:
                  formData.UserName,

                FullName:
                  formData.FullName,

                Password:
                  formData.Password,

                RoleID:
                  Number(formData.RoleID),

                IsActive:
                  formData.IsActive,

              }),

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to create user"
          );

        }


        // --------------------------------------------------
        // ADD NEW USER TO CURRENT RESULTS
        // --------------------------------------------------

        setUsers(
          (currentUsers) => [
            data,
            ...currentUsers,
          ]
        );


        handleCloseForm();

      }


    } catch (error) {

      console.error(
        "Error saving user:",
        error
      );

      alert(
        error.message ||
        "Unable to save user."
      );

    } finally {

      setSaving(false);

    }

  };


  // ========================================================
  // DELETE USER
  // ========================================================

  const handleDeleteUser = async (user) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${user.FullName || user.UserName}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const response =
        await fetch(
          `/api/users/${user.UserID}`,
          {
            method: "DELETE",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to delete user"
        );

      }


      // --------------------------------------------------
      // REMOVE FROM CURRENT SEARCH RESULTS
      // --------------------------------------------------

      setUsers(
        (currentUsers) =>
          currentUsers.filter(
            (item) =>
              item.UserID !==
              user.UserID
          )
      );


    } catch (error) {

      console.error(
        "Error deleting user:",
        error
      );

      alert(
        error.message ||
        "Unable to delete user."
      );

    }

  };


  // ========================================================
  // GET ROLE NAME
  // ========================================================

  const getRoleName = (roleID) => {

    const role =
      roles.find(
        (item) =>
          item.RoleID ===
          Number(roleID)
      );


    return role
      ? role.RoleName
      : "-";

  };


  // ========================================================
  // PAGE
  // ========================================================

  return (

    <div className="subject-page">


      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="subject-header">

        <h1 className="subject-title">
          Users
        </h1>


        <button
          type="button"
          className="subject-add-button"
          onClick={handleAddUser}
        >

          <span className="subject-add-icon">
            +
          </span>

          Add User

        </button>

      </div>


      {/* ==================================================
          SEARCH BAR
      ================================================== */}

      <div className="subject-toolbar">

        <div className="subject-search">

          <span className="subject-search-icon">
            🔍
          </span>


          <input
            type="text"
            value={search}
            placeholder="Search by username or full name or roll name ..."
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {

              if (
                event.key === "Enter"
              ) {

                searchUsers();

              }

            }}
          />


          <button
            type="button"
            onClick={searchUsers}
            disabled={loading}
          >

            {loading
              ? "Searching..."
              : "Search"
            }

          </button>

        </div>


        <div className="subject-count">

          {!hasSearched

            ? ""

            : loading

              ? "Searching..."

              : `${users.length} user${
                  users.length === 1
                    ? ""
                    : "s"
                }`

          }

        </div>

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div className="subject-error">

          {error}

        </div>

      )}


      {/* ==================================================
          USERS RESULTS
      ================================================== */}

      {loading ? (

        <div className="subject-loading">

          Searching users...

        </div>


      ) : !hasSearched ? (

        <div className="subject-search-message">

          Search for a user to display
          results.

        </div>


      ) : users.length === 0 ? (

        <div className="subject-search-message">

          No users found.

        </div>


      ) : (

        <div className="subject-table-wrapper">

          <table className="subject-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Username
                </th>

                <th>
                  Full Name
                </th>

                <th>
                  Role
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {users.map(
                (user) => (

                  <tr
                    key={
                      user.UserID
                    }
                  >

                    <td>
                      {user.UserID}
                    </td>


                    <td>

                      <div className="subject-username">

                        {user.UserName ||
                          "-"}

                      </div>

                    </td>


                    <td>

                      {user.FullName ||
                        "-"}

                    </td>


                    <td>

                      {user.RoleName ||
                        getRoleName(
                          user.RoleID
                        )}

                    </td>


                    <td>

                      <span
                        className={
                          user.IsActive
                            ? "subject-status-active"
                            : "subject-status-inactive"
                        }
                      >

                        {user.IsActive
                          ? "Active"
                          : "Inactive"
                        }

                      </span>

                    </td>


                    <td>

                      {user.CreatedDate

                        ? new Date(
                            user.CreatedDate
                          ).toLocaleDateString()

                        : "-"

                      }

                    </td>


                    <td>

                      <div className="subject-actions">

                        <button
                          type="button"
                          className="subject-edit-button"
                          onClick={() =>
                            handleEditUser(
                              user
                            )
                          }
                        >

                          Edit

                        </button>


                        <button
                          type="button"
                          className="subject-delete-button"
                          onClick={() =>
                            handleDeleteUser(
                              user
                            )
                          }
                        >

                          Delete

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}


      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showForm && (

        <div
          className="subject-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              handleCloseForm();

            }

          }}
        >


          <div className="subject-modal">


            {/* ============================================
                MODAL HEADER
            ============================================ */}

            <div className="subject-modal-header">

              <div>

                <h2>

                  {editingUser
                    ? "Edit User"
                    : "Add New User"
                  }

                </h2>


                <p>

                  {editingUser
                    ? "Update user information"
                    : "Enter user information"
                  }

                </p>

              </div>


              <button
                type="button"
                className="subject-close-button"
                onClick={
                  handleCloseForm
                }
                disabled={saving}
              >

                ×

              </button>

            </div>


            {/* ============================================
                FORM
            ============================================ */}

            <form
              className="subject-form"
              onSubmit={
                handleSubmit
              }
            >


              <div className="subject-form-grid">


                {/* ----------------------------------------
                    USERNAME
                ---------------------------------------- */}

                <div className="subject-form-group">

                  <label>
                    Username *
                  </label>


                  <input
                    type="text"
                    name="UserName"
                    value={
                      formData.UserName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Username"
                    required
                  />

                </div>


                {/* ----------------------------------------
                    FULL NAME
                ---------------------------------------- */}

                <div className="subject-form-group">

                  <label>
                    Full Name *
                  </label>


                  <input
                    type="text"
                    name="FullName"
                    value={
                      formData.FullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Full name"
                    required
                  />

                </div>


                {/* ----------------------------------------
                    PASSWORD
                ---------------------------------------- */}

                <div className="subject-form-group">

                  <label>

                    Password

                    {editingUser
                      ? " (leave empty to keep current)"
                      : " *"
                    }

                  </label>


                  <input
                    type="password"
                    name="Password"
                    value={
                      formData.Password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={
                      editingUser
                        ? "Enter new password if needed"
                        : "Password"
                    }
                    required={
                      !editingUser
                    }
                  />

                </div>


                {/* ----------------------------------------
                    ROLE
                ---------------------------------------- */}

                <div className="subject-form-group">

                  <label>
                    Role *
                  </label>


                  <select
                    name="RoleID"
                    value={
                      formData.RoleID
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      rolesLoading
                    }
                  >

                    <option value="">
                      {rolesLoading
                        ? "Loading roles..."
                        : "Select role"
                      }
                    </option>


                    {roles.map(
                      (role) => (

                        <option
                          key={
                            role.RoleID
                          }
                          value={
                            role.RoleID
                          }
                        >

                          {role.RoleName}

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* ----------------------------------------
                    ACTIVE
                ---------------------------------------- */}

                <div className="subject-form-group subject-active-group">

                  <label>
                    Status
                  </label>


                  <label className="subject-checkbox-label">

                    <input
                      type="checkbox"
                      name="IsActive"
                      checked={
                        formData.IsActive
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      Active
                    </span>

                  </label>

                </div>


              </div>


              {/* ==========================================
                  FORM BUTTONS
              ========================================== */}

              <div className="subject-form-actions">


                <button
                  type="button"
                  className="subject-cancel-button"
                  onClick={
                    handleCloseForm
                  }
                  disabled={saving}
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="subject-save-button"
                  disabled={saving}
                >

                  {saving

                    ? "Saving..."

                    : editingUser
                      ? "Update User"
                      : "Save User"

                  }

                </button>


              </div>


            </form>


          </div>

        </div>

      )}

    </div>

  );

};


export default Users;