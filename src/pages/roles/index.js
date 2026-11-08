import { useEffect, useState } from "react";

// INITIAL FORM
const emptyForm = {
  RoleName: "",
};

const  Roles = ()=> {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    
    // FORM / MODAL
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const searchRoles = async () => {
        const searchValue = search.trim();

        if (!searchValue) { 
            setRoles([]);
            setHasSearched(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/roles?search=${encodeURIComponent(searchValue)}` );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to search Roles"
                );
            }

            setRoles(data);
            setHasSearched(true);

        } catch (error) {

            console.error("Search Roles error:", error);
            alert(error.message || "Failed to search Roles");

        } finally {

            setLoading(false);
        }
    };

    // OPEN ADD ROLE FORM
    const handleAddRole = () => {
        setEditingRole(null);
        setFormData({ ...emptyForm, });
        setShowForm(true);
    };

    // OPEN EDIT ROLE FORM
    const handleEditRole = (role) => {

        setEditingRole(role);
        setFormData({RoleName:  role.RoleName || "",});
        setShowForm(true);

    };

    // CLOSE FORM
    const handleCloseForm = () => {

        if (saving) {return;}
        setShowForm(false);
        setEditingRole(null);
        setFormData({...emptyForm,});

    };

    // HANDLE FORM INPUT
    const handleChange = (event) => {
        const { name,  value,  } = event.target;
        setFormData((current) => ({...current, [name]: value,}));
    };

    // SAVE / UPDATE ROLE
    const handleSubmit = async (event) => {
        event.preventDefault();

        // BASIC VALIDATION
        if (!formData.RoleName || !formData.RoleName.trim() ) {
            alert( "Please enter the role name."  );
            return;
        }

        try {
            setSaving(true);

            // UPDATE EXISTING ROLE
            if (editingRole) {
                const response = await fetch(`/api/roles/${editingRole.RoleID}`,
                {
                    method: "PUT",
                    headers: {
                    "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify(
                        {...formData, }),

                });

                const data =  await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to update role");
                }

                // UPDATE ROLE IN CURRENT LIST
                setRoles( (currentRoles) =>
                    currentRoles.map((role) => role.RoleID === data.RoleID ? 
                        data : role )
                );

                // CLOSE FORM
                handleCloseForm();
            }

            // CREATE NEW ROLE
            else {

                const response = await fetch("/api/roles",
                {
                    method: "POST",
                    headers: {
                    "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({...formData, }),

                });

                const data =  await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to create role");
                }

                // ADD NEW ROLE TO TOP OF LIST
                setRoles( (currentRoles) => [ data,  ...currentRoles,  ] );

                // CLOSE FORM
                handleCloseForm();

            }

        } catch (error) {

            console.error("Error saving role:",error);
            alert(  error.message ||  "Unable to save role."  );

        } finally {

            setSaving(false);

        }

    };

    // DELETE ROLE
    const handleDeleteRole = async (role) => {
        const confirmed =  window.confirm(`Are you sure you want to delete ${role.RoleName}?` );

        if (!confirmed) {return; }

        try {
            const response = await fetch(`/api/roles/${role.RoleID}`,
                {
                    method: "DELETE",
                }
            );

            const data =   await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete role");
            }

            // REMOVE FROM CURRENT LIST ------------------------------------------------------
            setRoles( (currentRoles) =>
                currentRoles.filter( (item) =>  item.RoleID !==   role.RoleID )
            );

        } catch (error) {

            console.error("Error deleting role:",error);
            alert( error.message ||  "Unable to delete role." );
        }

    };

    // SEARCH Roles
    const filteredRoles =  roles.filter( (role) => {
        const searchText =  search.toLowerCase().trim();

        // Show everything if search is empty
        if (!searchText) { return true;}

        return (String(role.RoleID).toLowerCase().includes(searchText)
          || ( role.RoleName ||  ""  ).toLowerCase().includes(searchText)
        );

      }
    );

  return (

      <div className="subject-page">

        {/* PAGE HEADER ================================================== */}
        <div className="subject-header">

            <h1 className="subject-title">
              Roles
            </h1>

            <button
                type="button"
                className="subject-add-button"
                onClick={handleAddRole}
            >
                <span className="subject-add-icon">+</span>

                Add Role

            </button>

        </div>


        {/* SEARCH BAR ================================================== */}
        <div className="subject-toolbar">

          <div className="subject-search">

            <span className="subject-search-icon">🔍</span>

            <input
              type="text"
              value={search}
              placeholder="Search by name, ..."
              onChange={(event) => setSearch(event.target.value ) }
              onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        searchRoles();
                    }
                    }}
            />

            <button
                type="button"
                onClick={searchRoles}
                disabled={loading}
            >
                {loading ? "Searching..." : "Search"}
            </button>
            
          </div>

          <div className="subject-count">

            {!hasSearched
                ? ""
                : loading
                ? "Searching..."
                : `${roles.length} role${roles.length === 1 ? "" : "s"}`
            }

          </div>


        </div>


        {/* ERROR ================================================== */}
        {error && (
          <div className="subject-error">{error}</div>
        )}


        {/* Roles RESULTS ================================================== */}
        {loading ? (
            <div className="subject-loading">
                Searching roles...
            </div>

            ) : !hasSearched ? (

                <div className="subject-search-message">
                    Search for a role to display results.
                </div>

                ) : roles.length === 0 ? (

                <div className="subject-search-message">
                    No roles found.
                </div>

                ) : (

                <div className="subject-table-wrapper">

                    <table className="subject-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Role Name</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>
                            {roles.map( (role) => (
                                <tr  key={role.RoleID} >
                                    <td>{role.RoleID}</td>
                                    <td>
                                        <div className="subject-name">
                                            {role.RoleName || "-"}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="subject-actions">
                                            <button
                                                type="button"
                                                className="subject-edit-button"
                                                onClick={() => handleEditRole(role)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="subject-delete-button"
                                                onClick={() => handleDeleteRole(role)}
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
          <div  className="subject-modal-overlay"
            onMouseDown={(event) => {if (event.target ===  event.currentTarget) {handleCloseForm();} }}
          >
            <div className="subject-modal">

                {/* MODAL HEADER */}
                <div className="subject-modal-header">
                    <div>
                        <h2>{editingRole ? "Edit Role" : "Add New Role" }</h2>
                        <p>{editingRole  ? "Update role information" : "Enter role information"}</p>
                    </div>

                    <button  type="button"  className="subject-close-button" 
                        onClick={handleCloseForm} disabled={saving}>×</button>
                </div>

                {/* FORM ========================================== */}
                <form  className="subject-form"   onSubmit={handleSubmit}  >

                    <div className="subject-form-grid">

                        {/* FULL NAME  -------------------------------------- */}
                        <div className="subject-form-group subject-full-width">

                            <label>Role Name *</label>
                            <input  type="text"  name="RoleName"  value={formData.RoleName}
                                onChange={handleChange}
                                placeholder="Enter role full name"  required
                            />

                        </div>

                    </div>

                    {/* ========================================
                        FORM BUTTONS
                    ======================================== */}

                    <div className="subject-form-actions">

                        <button type="button" className="subject-cancel-button"
                            onClick={handleCloseForm} disabled={saving}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="subject-save-button" disabled={saving}>
                            {saving ? "Saving..." : editingRole ? "Update Role" : "Save Role"}
                        </button>

                    </div>

                </form>

            </div>

          </div>

        )}

      </div>

  );

}

export default Roles;