import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiCheckCircle,
  FiDatabase,
  FiKey,
  FiMap,
  FiRefreshCw,
  FiShield,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import api from "../../services/api";
import Loader from "../../components/common/Loader";
import "./InternalAdminPages.css";

const PAGE_SIZE = 100;
const SECTIONS = [
  { id: "users", icon: FiUserPlus, label: "addUser" },
  { id: "silviculturists", icon: FiUsers, label: "silviculturists" },
  { id: "authenticate", icon: FiShield, label: "authenticateUsers" },
  { id: "activate-ro", icon: FiCheckCircle, label: "activateRoUsers" },
  { id: "reset-password", icon: FiKey, label: "resetPassword" },
  { id: "designations", icon: FiUsers, label: "designations" },
  { id: "species", icon: FiDatabase, label: "species" },
  { id: "species-age-height", icon: FiDatabase, label: "speciesAgeHeight" },
  { id: "directory", icon: FiMap, label: "directory" },
];
const MASTER_URL = "workflow/admin/masters/";
const emptyUserForm = {
  level_id: "",
  user_type: "U",
  fname: "",
  lname: "",
  email: "",
  contact_number: "",
  alternate_contact_number: "",
  designation_id: "",
  state_id: "",
  circle_id: "",
  division_id: "",
  range_id: "",
  password: "",
  confirm_password: "",
};
const emptySilviculturistForm = {
  fname: "",
  lname: "",
  email: "",
  contact_number: "",
  alternate_contact_number: "",
  designation_id: "",
  state_id: "",
  circle_id: "",
  division_id: "",
  password: "",
  confirm_password: "",
};
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};
const recordName = (user) =>
  [user.fname, user.lname].filter(Boolean).join(" ") || user.emailid || "—";
const normalizeMobileNumber = (value) => value.replace(/\D/g, "").slice(0, 10);

export default function InternalAdminPages() {
  const { section } = useParams();
  const { t } = useTranslation();
  const user = useMemo(() => getUser(), []);
  const role = user?.workflow_role || "ro";
  const canManage = ["national", "state", "circle", "dfo"].includes(role);
  const sections = SECTIONS.filter(({ id }) => id !== "reset-password" || role === "state");
  const sectionAllowed = sections.some((item) => item.id === section);
  const { state: userScopeState, circle: userScopeCircle, division: userScopeDivision } = {
    state: user?.scope?.state_id ? String(user.scope.state_id) : "",
    circle: user?.scope?.circle_id ? String(user.scope.circle_id) : "",
    division: user?.scope?.division_id ? String(user.scope.division_id) : "",
  };
  const [lookups, setLookups] = useState({
    levels: [],
    states: [],
    designations: [],
    species: [],
    ages: [],
    heights: [],
    species_age_height: [],
    allowed_child_level: null,
  });
  const [directory, setDirectory] = useState({
    states: [],
    circles: [],
    divisions: [],
    ranges: [],
    sections: [],
    compartments: [],
  });
  const [directoryRangeId, setDirectoryRangeId] = useState("");
  const [directorySectionId, setDirectorySectionId] = useState("");
  const [directoryEntryName, setDirectoryEntryName] = useState("");
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [userLevelFilter, setUserLevelFilter] = useState("");
  const [userOffset, setUserOffset] = useState(0);
  const [masterCount, setMasterCount] = useState(0);
  const [masterOffset, setMasterOffset] = useState(0);
  const [form, setForm] = useState(emptyUserForm);
  const [silviculturistForm, setSilviculturistForm] = useState(emptySilviculturistForm);
  const [silviculturists, setSilviculturists] = useState([]);
  const [silviculturistCount, setSilviculturistCount] = useState(0);
  const [silviculturistOffset, setSilviculturistOffset] = useState(0);
  const [masterForm, setMasterForm] = useState({});
  const [selectedUser, setSelectedUser] = useState("");
  const [userAction, setUserAction] = useState("approve");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDirectory = useCallback(async (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== "" && value != null)
    );
    const { data } = await api.get(`workflow/admin/directory/${query.size ? `?${query}` : ""}`);
    setDirectory(data);
    return data;
  }, []);

  const loadBeatDirectory = useCallback(async (rangeId, sectionId = "") => {
    const query = new URLSearchParams({ range_id: rangeId });
    if (sectionId) query.set("section_id", sectionId);
    const { data } = await api.get(`workflow/admin/directory/?${query}`);
    return data;
  }, []);

  const loadUsers = useCallback(async (levelId = userLevelFilter, pageOffset = 0, userType = "") => {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageOffset) });
    if (levelId) query.set("level_id", levelId);
    if (userType) query.set("user_type", userType);
    const { data } = await api.get(`workflow/admin/users/?${query}`);
    setUsers(data.users || []);
    setUserCount(data.count || 0);
    setUserOffset(pageOffset);
  }, [userLevelFilter]);

  const loadSilviculturists = useCallback(async (pageOffset = 0) => {
    const { data } = await api.get(
      `workflow/admin/silviculturists/?limit=${PAGE_SIZE}&offset=${pageOffset}`
    );
    setSilviculturists(data.users || []);
    setSilviculturistCount(data.count || 0);
    setSilviculturistOffset(pageOffset);
  }, []);

  const loadMaster = useCallback(async (master, pageOffset = 0) => {
    const { data } = await api.get(
      `${MASTER_URL}${master}/?limit=${PAGE_SIZE}&offset=${pageOffset}`
    );
    setRecords(data.records || []);
    setMasterCount(data.count || 0);
    setMasterOffset(pageOffset);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.get("workflow/admin/lookups/");
      setLookups(data);
      setForm((current) => ({
        ...current,
        level_id: current.level_id || String(data.allowed_child_level || ""),
        state_id: current.state_id || userScopeState,
        circle_id: current.circle_id || userScopeCircle,
        division_id: current.division_id || userScopeDivision,
      }));
      setSilviculturistForm((current) => ({
        ...current,
        state_id: current.state_id || userScopeState,
        circle_id: current.circle_id || userScopeCircle,
        division_id: current.division_id || userScopeDivision,
      }));
      const directoryData = await loadDirectory();
      if (section === "users" || section === "authenticate" ||
          section === "activate-ro" || section === "reset-password") {
        const initialLevel = section === "activate-ro" ? "5" : userLevelFilter;
        await loadUsers(initialLevel, 0, section === "activate-ro" ? "U" : "");
        if (section === "activate-ro") setUserLevelFilter("5");
      } else if (section === "silviculturists") {
        await loadSilviculturists(0);
      } else if (section === "designations") {
        await loadMaster("designations");
      } else if (section === "species") {
        await loadMaster("species");
      } else if (section === "species-age-height") {
        setRecords(data.species_age_height || []);
      } else if (section === "directory") {
        const levelForDirectory = {
          national: "circle",
          state: "circle",
          circle: "division",
          dfo: "range",
        }[role];
        const list = levelForDirectory === "circle" ? directoryData.circles
          : levelForDirectory === "division" ? directoryData.divisions
            : directoryData.ranges;
        setRecords(list || []);
        if (role === "dfo") {
          const availableRanges = directoryData.ranges || [];
          setDirectoryRangeId((current) => (
            availableRanges.some((item) => String(item.range_id) === current)
              ? current
              : String(availableRanges.find((item) => item.range_active === "Y")?.range_id || "")
          ));
        }
      }
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    } finally {
      setLoading(false);
    }
  }, [
    loadDirectory, loadMaster, loadSilviculturists, loadUsers, role, section, t, userLevelFilter,
    userScopeCircle, userScopeDivision, userScopeState,
  ]);

  useEffect(() => {
    if (section !== "directory" || role !== "dfo" || !directoryRangeId) return undefined;
    let cancelled = false;
    const loadBeats = async () => {
      try {
        const data = await loadBeatDirectory(directoryRangeId);
        if (cancelled) return;
        setDirectory(data);
        const activeSections = data.sections.filter((item) => item.section_active === "Y");
        const selected = activeSections.find(
          (item) => String(item.section_id) === directorySectionId
        ) || activeSections[0];
        const nextSectionId = selected ? String(selected.section_id) : "";
        setDirectorySectionId(nextSectionId);
        if (nextSectionId) {
          const detail = await loadBeatDirectory(directoryRangeId, nextSectionId);
          if (!cancelled) setDirectory(detail);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || t("workflow.loadError"));
      }
    };
    loadBeats();
    return () => { cancelled = true; };
  }, [directoryRangeId, directorySectionId, loadBeatDirectory, role, section, t]);

  useEffect(() => {
    if (!canManage || !sectionAllowed) return;
    load();
  }, [canManage, load, sectionAllowed]);

  if (!sectionAllowed) {
    return <Navigate to="/internal/admin/users" replace />;
  }
  if (!canManage) {
    return <Navigate to="/internal/dashboard" replace />;
  }

  const setField = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "state_id") {
        next.circle_id = "";
        next.division_id = "";
        next.range_id = "";
      } else if (name === "circle_id") {
        next.division_id = "";
        next.range_id = "";
      } else if (name === "division_id") {
        next.range_id = "";
      }
      return next;
    });
  };

  const setSilviculturistField = (name, value) => {
    setSilviculturistForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "state_id") {
        next.circle_id = "";
        next.division_id = "";
      } else if (name === "circle_id") {
        next.division_id = "";
      }
      return next;
    });
  };

  const updateDirectoryOptions = async (values) => {
    try {
      const result = await loadDirectory(values);
      if (values.state_id) {
        setDirectory((current) => ({ ...current, circles: result.circles || [] }));
      }
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    }
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post("workflow/admin/users/", form);
      setForm((current) => ({
        ...emptyUserForm,
        level_id: current.level_id,
        state_id: userScopeState,
        circle_id: userScopeCircle,
        division_id: userScopeDivision,
      }));
      setNotice(t("workflow.admin.userCreated"));
      await loadUsers(userLevelFilter, 0);
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const submitSilviculturist = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post("workflow/admin/silviculturists/", silviculturistForm);
      setSilviculturistForm({
        ...emptySilviculturistForm,
        state_id: userScopeState,
        circle_id: userScopeCircle,
        division_id: userScopeDivision,
      });
      await loadSilviculturists(0);
      setNotice(t("workflow.admin.silviculturistCreated"));
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const updateSilviculturist = async (userItem) => {
    const action = userItem.active ? "deactivate" : "activate";
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.patch("workflow/admin/silviculturists/", {
        user_id: userItem.id,
        action,
      });
      await loadSilviculturists(silviculturistOffset);
      setNotice(t(`workflow.directory.actions.${action}`));
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const applyUserAction = async (target, action = userAction, extra = {}) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.patch("workflow/admin/users/", { user_id: target.id, action, ...extra });
      setNotice(t("workflow.admin.actionSaved"));
      if (section === "users" || section === "authenticate" ||
          section === "activate-ro" || section === "reset-password") {
        await loadUsers(userLevelFilter, userOffset, section === "activate-ro" ? "U" : "");
      }
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const submitMaster = async (event, master, payload) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post(`${MASTER_URL}${master}/`, payload);
      setMasterForm({});
      if (master === "species-age-height") {
        const query = payload.state_id
          ? `?state_id=${encodeURIComponent(payload.state_id)}`
          : "";
        const { data } = await api.get(`workflow/admin/lookups/${query}`);
        setLookups(data);
        setRecords(data.species_age_height || []);
        setMasterOffset(0);
        setMasterCount((data.species_age_height || []).length);
      } else {
        await loadMaster(master, 0);
      }
      setNotice(t("workflow.admin.recordAdded"));
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const toggleMaster = async (master, item, idKey, activeKey) => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`${MASTER_URL}${master}/`, {
        id: item[idKey],
        active: item[activeKey] !== "Y",
      });
      if (master === "species-age-height") await load();
      else await loadMaster(master, masterOffset);
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const submitDirectory = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post("workflow/admin/directory/", {
        kind: directoryKind,
        name: masterForm.name,
        state_id: form.state_id,
      });
      setMasterForm({});
      await load();
      setNotice(t("workflow.admin.recordAdded"));
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const submitBeatDirectory = async (event, kind) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = kind === "section"
        ? { kind, name: directoryEntryName, range_id: directoryRangeId }
        : { kind, name: directoryEntryName, section_id: directorySectionId };
      const { data } = await api.post("workflow/admin/directory/", payload);
      setDirectoryEntryName("");
      const dataAfterSave = await loadBeatDirectory(
        directoryRangeId,
        kind === "section" ? String(data.id) : directorySectionId
      );
      setDirectory(dataAfterSave);
      if (kind === "section") setDirectorySectionId(String(data.id));
      if (kind === "compartment") {
        const sectionExists = dataAfterSave.sections.some(
          (item) => String(item.section_id) === directorySectionId
        );
        if (!sectionExists) setDirectorySectionId("");
      }
      setNotice(t("workflow.admin.recordAdded"));
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const toggleBeatDirectory = async (kind, item, idKey, activeKey) => {
    setBusy(true);
    setError("");
    try {
      await api.patch("workflow/admin/directory/", {
        kind,
        id: item[idKey],
        active: item[activeKey] !== "Y",
      });
      const data = await loadBeatDirectory(directoryRangeId, directorySectionId);
      setDirectory(data);
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const selectDirectoryRange = (rangeId) => {
    setDirectoryRangeId(rangeId);
    setDirectorySectionId("");
    setDirectoryEntryName("");
    setDirectory((current) => ({ ...current, sections: [], compartments: [] }));
  };

  const selectDirectorySection = (sectionId) => {
    setDirectorySectionId(sectionId);
  };

  const directoryKind = { national: "circle", state: "circle", circle: "division", dfo: "range" }[role];
  const childLevel = Number(lookups.allowed_child_level);
  const childLevelName = lookups.levels.find((level) => Number(level.id) === childLevel)?.name || "";
  const showState = childLevel <= 2 || role === "national";
  const showCircle = childLevel >= 3;
  const showDivision = childLevel >= 4;
  const showRange = childLevel >= 5;
  const actionOptions = ["approve", "activate", "deactivate", "block", "unblock"];

  const selectField = (name, label, options, key, text, disabled = false) => (
    <label className="workflow-field" key={name}>
      <span>{label}</span>
      <select
        required
        disabled={disabled}
        value={form[name] || ""}
        onChange={(event) => {
          const value = event.target.value;
          setField(name, value);
          if (name === "state_id") updateDirectoryOptions({ state_id: value });
          if (name === "circle_id") updateDirectoryOptions({ state_id: form.state_id, circle_id: value });
          if (name === "division_id") updateDirectoryOptions({ state_id: form.state_id, circle_id: form.circle_id, division_id: value });
        }}
      >
        <option value="">{t("workflow.selectOption")}</option>
        {options.map((item) => (
          <option key={item[key]} value={item[key]}>{item[text]}</option>
        ))}
      </select>
    </label>
  );

  const silviculturistSelectField = (name, label, options, key, text, disabled, required = false) => (
    <label className="workflow-field" key={`silvi-${name}`}>
      <span>{label}</span>
      <select
        required={required}
        disabled={disabled}
        value={silviculturistForm[name] || ""}
        onChange={(event) => {
          const value = event.target.value;
          setSilviculturistField(name, value);
          if (name === "state_id") updateDirectoryOptions({ state_id: value });
          if (name === "circle_id") {
            updateDirectoryOptions({
              state_id: silviculturistForm.state_id,
              circle_id: value,
            });
          }
        }}
      >
        {!required && <option value="">{t("workflow.admin.anyOffice")}</option>}
        {required && <option value="">{t("workflow.selectOption")}</option>}
        {options.map((item) => (
          <option key={item[key]} value={item[key]}>{item[text]}</option>
        ))}
      </select>
    </label>
  );

  const renderUserTable = (list, mode) => (
    <div className="workflow-table-wrap">
      <table className="workflow-table workflow-admin__table">
        <thead>
          <tr>
            <th>{t("workflow.admin.name")}</th>
            <th>{t("workflow.admin.email")}</th>
            <th>{t("workflow.admin.level")}</th>
            <th>{t("workflow.admin.accountType")}</th>
            <th>{t("workflow.directory.userStatus")}</th>
            <th>{t("workflow.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => {
            const level = lookups.levels.find((row) => Number(row.id) === item.level_id);
            const rowActionOptions = Number(item.level_id) === 5
              ? actionOptions
              : ["block", "unblock"];
            const selectedAction = rowActionOptions.includes(userAction)
              ? userAction
              : item.account_blocked === "Y" ? "unblock" : "block";
            const actionList = item.approved === "Y"
              ? [item.active === "Y" ? "deactivate" : "activate"]
              : ["approve"];
            if (item.account_blocked === "Y") actionList.push("unblock");
            else actionList.push("block");
            return (
              <tr key={item.id}>
                <td>{recordName(item)}</td>
                <td>{item.emailid || "—"}</td>
                <td>{level?.name || item.level_id}</td>
                <td>{item.user_type === "A" ? t("workflow.admin.adminRole") : t("workflow.admin.userRole")}</td>
                <td>
                  {t(item.approved === "Y" ? "workflow.directory.approved" : "workflow.directory.notApproved")}
                  {" · "}{t(item.active === "Y" ? "workflow.directory.active" : "workflow.directory.inactive")}
                  {item.account_blocked === "Y" && ` · ${t("workflow.directory.blocked")}`}
                </td>
                <td className="workflow-admin__actions">
                  {mode === "authenticate" && (
                    <select
                      aria-label={t("workflow.admin.selectActionFor", { name: recordName(item) })}
                      value={selectedAction}
                      onChange={(event) => setUserAction(event.target.value)}
                    >
                      {rowActionOptions.map((action) => (
                        <option key={action} value={action}>{t(`workflow.directory.actions.${action}`)}</option>
                      ))}
                    </select>
                  )}
                  {(mode === "authenticate" ? [selectedAction] : actionList).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={busy}
                      onClick={() => applyUserAction(item, action)}
                    >
                      {t(`workflow.directory.actions.${action}`)}
                    </button>
                  ))}
                  {mode === "reset-password" && (
                    <button type="button" disabled={busy} onClick={() => setSelectedUser(String(item.id))}>
                      {t("workflow.admin.setPassword")}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {list.length === 0 && <div className="workflow-empty"><FiUsers aria-hidden="true" /><p>{t("workflow.directory.noUsers")}</p></div>}
    </div>
  );

  const title = SECTIONS.find((item) => item.id === section)?.label;
  const selectedResetUser = users.find((item) => String(item.id) === selectedUser);

  return (
    <main className="workflow-page workflow-admin">
      <div className="workflow-page__topline">
        <Link className="workflow-back" to="/internal/dashboard">{t("workflow.backToDashboard")}</Link>
      </div>
      <section className="workflow-module-heading">
        <span className="workflow-eyebrow"><FiShield aria-hidden="true" /> {t("workflow.internalPortal")}</span>
        <h1>{t(`workflow.admin.${title}`)}</h1>
        <p>{t("workflow.admin.description")}</p>
      </section>

      <nav className="workflow-admin__nav" aria-label={t("workflow.admin.managementSections")}>
        {sections.map(({ id, icon: Icon, label }) => (
          <Link key={id} to={`/internal/admin/${id}`} aria-current={id === section ? "page" : undefined}>
            <Icon aria-hidden="true" /> {t(`workflow.admin.${label}`)}
          </Link>
        ))}
      </nav>

      {error && <div className="workflow-alert" role="alert">{error}</div>}
      {notice && <div className="workflow-success" role="status">{notice}</div>}

      {loading ? (
        <div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div>
      ) : (
        <>
          {(section === "users") && (
            <section className="workflow-admin__panel">
              <header className="workflow-admin__heading">
                <div><h2>{t("workflow.admin.addUser")}</h2><p>{t("workflow.admin.createChild", { level: childLevelName })}</p></div>
              </header>
              <form className="workflow-form" onSubmit={submitUser}>
                <div className="workflow-form__grid">
                  <label className="workflow-field">
                    <span>{t("workflow.admin.level")}</span>
                    <select required value={form.level_id} onChange={(event) => setField("level_id", event.target.value)}>
                      <option value="">{t("workflow.selectOption")}</option>
                      {lookups.levels.filter((item) => Number(item.id) === childLevel).map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="workflow-field">
                    <span>{t("workflow.admin.accountType")}</span>
                    <select value={form.user_type} onChange={(event) => setField("user_type", event.target.value)}>
                      {lookups.user_types.map((item) => <option key={item.id} value={item.id}>{t(item.id === "A" ? "workflow.admin.adminRole" : "workflow.admin.userRole")}</option>)}
                    </select>
                  </label>
                  {showState && selectField("state_id", t("workflow.fields.state"), directory.states, "state_id", "state_name", role === "state" || role === "circle" || role === "dfo")}
                  {showCircle && selectField("circle_id", t("workflow.fields.circle"), directory.circles.filter((item) => item.circle_active === "Y"), "circle_id", "circle_name", role === "circle" || role === "dfo")}
                  {showDivision && selectField("division_id", t("workflow.fields.division"), directory.divisions.filter((item) => item.division_active === "Y"), "division_id", "division_name", role === "dfo")}
                  {showRange && selectField("range_id", t("workflow.fields.range"), directory.ranges.filter((item) => item.range_active === "Y"), "range_id", "range_name")}
                  {[
                    ["fname", "firstName", "text", true],
                    ["lname", "lastName", "text", true],
                    ["email", "email", "email", true],
                    ["contact_number", "contactNumber", "tel", false],
                    ["alternate_contact_number", "alternateContact", "tel", false],
                  ].map(([name, label, type, required]) => (
                    <label className="workflow-field" key={name}>
                      <span>{t(`workflow.admin.${label}`)}</span>
                      <input
                        required={required}
                        type={type === "tel" ? "text" : type}
                        inputMode={type === "tel" ? "numeric" : undefined}
                        maxLength={type === "tel" ? 10 : undefined}
                        pattern={type === "tel" ? "[0-9]{10}" : undefined}
                        value={form[name]}
                        onChange={(event) => setField(
                          name,
                          type === "tel" ? normalizeMobileNumber(event.target.value) : event.target.value
                        )}
                      />
                    </label>
                  ))}
                  <label className="workflow-field">
                    <span>{t("workflow.admin.designation")}</span>
                    <select required value={form.designation_id} onChange={(event) => setField("designation_id", event.target.value)}>
                      <option value="">{t("workflow.selectOption")}</option>
                      {lookups.designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  {["password", "confirm_password"].map((name) => (
                    <label className="workflow-field" key={name}>
                      <span>{t(`workflow.admin.${name === "password" ? "password" : "confirmPassword"}`)}</span>
                      <input required minLength={8} type="password" autoComplete="new-password" value={form[name]} onChange={(event) => setField(name, event.target.value)} />
                    </label>
                  ))}
                </div>
                <div className="workflow-form__actions">
                  <button type="submit" className="workflow-button" disabled={busy}>
                    {busy ? t("workflow.saving") : t("workflow.admin.createUser")}
                  </button>
                </div>
              </form>
            </section>
          )}

          {section === "silviculturists" && (
            <>
              <section className="workflow-admin__panel">
                <header className="workflow-admin__heading">
                  <div>
                    <h2>{t("workflow.admin.createSilviculturist")}</h2>
                    <p>{t("workflow.admin.silviculturistDescription")}</p>
                  </div>
                </header>
                <form className="workflow-form" onSubmit={submitSilviculturist}>
                  <div className="workflow-form__grid">
                    {role === "national" && silviculturistSelectField(
                      "state_id", t("workflow.fields.state"), directory.states,
                      "state_id", "state_name", false, true
                    )}
                    {role !== "national" && silviculturistSelectField(
                      "state_id", t("workflow.fields.state"), directory.states,
                      "state_id", "state_name", true, true
                    )}
                    {role === "circle" || role === "dfo"
                      ? silviculturistSelectField(
                        "circle_id", t("workflow.fields.circle"), directory.circles,
                        "circle_id", "circle_name", true, role === "circle"
                      )
                      : silviculturistSelectField(
                        "circle_id", t("workflow.fields.circle"), directory.circles,
                        "circle_id", "circle_name", false
                      )}
                    {silviculturistSelectField(
                      "division_id", t("workflow.fields.division"), directory.divisions,
                      "division_id", "division_name",
                      role === "dfo" || !silviculturistForm.circle_id,
                      role === "dfo"
                    )}
                    <label className="workflow-field">
                      <span>{t("workflow.admin.designation")}</span>
                      <select
                        required
                        value={silviculturistForm.designation_id}
                        onChange={(event) => setSilviculturistField("designation_id", event.target.value)}
                      >
                        <option value="">{t("workflow.selectOption")}</option>
                        {lookups.designations.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </label>
                    {[
                      ["fname", "firstName", "text", true],
                      ["lname", "lastName", "text", true],
                      ["email", "email", "email", true],
                      ["contact_number", "contactNumber", "tel", false],
                      ["alternate_contact_number", "alternateContact", "tel", false],
                    ].map(([name, label, type, required]) => (
                      <label className="workflow-field" key={`silvi-${name}`}>
                        <span>{t(`workflow.admin.${label}`)}</span>
                        <input
                          required={required}
                          type={type === "tel" ? "text" : type}
                          inputMode={type === "tel" ? "numeric" : undefined}
                          maxLength={type === "tel" ? 10 : undefined}
                          pattern={type === "tel" ? "[0-9]{10}" : undefined}
                          value={silviculturistForm[name]}
                          onChange={(event) => setSilviculturistField(
                            name,
                            type === "tel" ? normalizeMobileNumber(event.target.value) : event.target.value
                          )}
                        />
                      </label>
                    ))}
                    {["password", "confirm_password"].map((name) => (
                      <label className="workflow-field" key={`silvi-${name}`}>
                        <span>{t(`workflow.admin.${name === "password" ? "password" : "confirmPassword"}`)}</span>
                        <input
                          required
                          minLength={8}
                          type="password"
                          autoComplete="new-password"
                          value={silviculturistForm[name]}
                          onChange={(event) => setSilviculturistField(name, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="workflow-form__actions">
                    <button type="submit" className="workflow-button" disabled={busy}>
                      {busy ? t("workflow.saving") : t("workflow.admin.createSilviculturist")}
                    </button>
                  </div>
                </form>
              </section>
              <section className="workflow-admin__panel">
                <header className="workflow-admin__heading">
                  <div>
                    <h2>{t("workflow.admin.silviculturists")}</h2>
                    <p>{t("workflow.admin.usersInScope", { count: silviculturistCount })}</p>
                  </div>
                  <button
                    type="button"
                    className="workflow-admin__silviculturist-refresh"
                    onClick={() => loadSilviculturists(silviculturistOffset)}
                    disabled={busy}
                  >
                    <FiRefreshCw aria-hidden="true" /> {t("workflow.refresh")}
                  </button>
                </header>
                <div className="workflow-table-wrap">
                  <table className="workflow-table workflow-admin__table">
                    <thead>
                      <tr>
                        <th>{t("workflow.admin.name")}</th>
                        <th>{t("workflow.admin.email")}</th>
                        <th>{t("workflow.fields.state")}</th>
                        <th>{t("workflow.fields.circle")}</th>
                        <th>{t("workflow.fields.division")}</th>
                        <th>{t("workflow.directory.userStatus")}</th>
                        <th>{t("workflow.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {silviculturists.map((item) => (
                        <tr key={item.id}>
                          <td>{recordName(item)}</td>
                          <td>{item.emailid || "—"}</td>
                          <td>{item.state_name || "—"}</td>
                          <td>{item.circle_name || "—"}</td>
                          <td>{item.division_name || "—"}</td>
                          <td>{t(item.active ? "workflow.directory.active" : "workflow.directory.inactive")}</td>
                          <td className="workflow-admin__silviculturist-actions">
                            <button
                              type="button"
                              className={`workflow-admin__silviculturist-toggle${item.active ? " is-active" : ""}`}
                              disabled={busy}
                              onClick={() => updateSilviculturist(item)}
                            >
                              {t(`workflow.directory.actions.${item.active ? "deactivate" : "activate"}`)}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!silviculturists.length && (
                    <div className="workflow-empty"><FiUsers aria-hidden="true" /><p>{t("workflow.directory.noUsers")}</p></div>
                  )}
                </div>
                <AdminPagination
                  offset={silviculturistOffset}
                  count={silviculturistCount}
                  length={silviculturists.length}
                  loading={busy}
                  onPage={loadSilviculturists}
                  t={t}
                />
              </section>
            </>
          )}

          {["authenticate", "activate-ro", "reset-password"].includes(section) && (
            <section className="workflow-admin__panel">
              <header className="workflow-admin__heading">
                <div>
                  <h2>{t(`workflow.admin.${title}`)}</h2>
                  <p>{t("workflow.admin.usersInScope", { count: userCount })}</p>
                </div>
                <div className="workflow-admin__filters">
                  {section !== "activate-ro" && (
                    <select
                      aria-label={t("workflow.admin.filterLevel")}
                      value={userLevelFilter}
                      onChange={(event) => {
                        setUserLevelFilter(event.target.value);
                        loadUsers(event.target.value, 0);
                      }}
                    >
                      <option value="">{t("workflow.admin.allLevels")}</option>
                      {lookups.levels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  )}
                  <button type="button" onClick={() => loadUsers(section === "activate-ro" ? "5" : userLevelFilter, 0, section === "activate-ro" ? "U" : "")} disabled={busy}>
                    <FiRefreshCw aria-hidden="true" /> {t("workflow.refresh")}
                  </button>
                </div>
              </header>
              {section === "reset-password" && selectedResetUser && (
                <form
                  className="workflow-admin__password-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    applyUserAction(selectedResetUser, "reset_password", {
                      password: data.get("password"),
                      confirm_password: data.get("confirm_password"),
                    });
                    setSelectedUser("");
                  }}
                >
                  <strong>{recordName(selectedResetUser)}</strong>
                  <input name="password" type="password" minLength="8" autoComplete="new-password" required aria-label={t("workflow.admin.password")} placeholder={t("workflow.admin.password")} />
                  <input name="confirm_password" type="password" minLength="8" autoComplete="new-password" required aria-label={t("workflow.admin.confirmPassword")} placeholder={t("workflow.admin.confirmPassword")} />
                  <button type="submit" disabled={busy}>{t("workflow.admin.resetPassword")}</button>
                </form>
              )}
              {renderUserTable(users, section)}
              <AdminPagination
                offset={userOffset}
                count={userCount}
                length={users.length}
                loading={busy}
                onPage={(nextOffset) => loadUsers(userLevelFilter, nextOffset, section === "activate-ro" ? "U" : "")}
                t={t}
              />
            </section>
          )}

          {section === "designations" && (
            <section className="workflow-admin__panel">
              <form className="workflow-admin__inline-form" onSubmit={(event) => submitMaster(event, "designations", masterForm)}>
                <label className="workflow-field"><span>{t("workflow.admin.designationCode")}</span><input required maxLength={50} value={masterForm.code || ""} onChange={(event) => setMasterForm((current) => ({ ...current, code: event.target.value }))} /></label>
                <label className="workflow-field"><span>{t("workflow.admin.designation")}</span><input required maxLength={200} value={masterForm.name || ""} onChange={(event) => setMasterForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <button className="workflow-button" disabled={busy}>{t("workflow.admin.addDesignation")}</button>
              </form>
              <MasterTable records={records} columns={["Designation_Code", "Designation_Name", "Designation_Active"]} labels={[t("workflow.admin.designationCode"), t("workflow.admin.designation"), t("workflow.directory.userStatus")]} onToggle={(item) => toggleMaster("designations", item, "Designation_ID", "Designation_Active")} t={t} />
              <AdminPagination offset={masterOffset} count={masterCount} length={records.length} loading={busy} onPage={(nextOffset) => loadMaster("designations", nextOffset)} t={t} />
            </section>
          )}

          {section === "species" && (
            <section className="workflow-admin__panel">
              <form className="workflow-admin__inline-form" onSubmit={(event) => submitMaster(event, "species", masterForm)}>
                <label className="workflow-field"><span>{t("workflow.admin.speciesName")}</span><input required maxLength={500} value={masterForm.name || ""} onChange={(event) => setMasterForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className="workflow-field"><span>{t("workflow.admin.scientificName")}</span><input maxLength={4000} value={masterForm.scientific_name || ""} onChange={(event) => setMasterForm((current) => ({ ...current, scientific_name: event.target.value }))} /></label>
                <label className="workflow-field"><span>{t("workflow.admin.powo")}</span><input maxLength={100} value={masterForm.powo || ""} onChange={(event) => setMasterForm((current) => ({ ...current, powo: event.target.value }))} /></label>
                <button className="workflow-button" disabled={busy}>{t("workflow.admin.addSpecies")}</button>
              </form>
              <MasterTable records={records} columns={["Species_Name", "Species_S_Name", "Species_POWO", "Species_Active"]} labels={[t("workflow.admin.speciesName"), t("workflow.admin.scientificName"), t("workflow.admin.powo"), t("workflow.directory.userStatus")]} onToggle={(item) => toggleMaster("species", item, "Species_ID", "Species_Active")} t={t} />
              <AdminPagination offset={masterOffset} count={masterCount} length={records.length} loading={busy} onPage={(nextOffset) => loadMaster("species", nextOffset)} t={t} />
            </section>
          )}

          {section === "species-age-height" && (
            <section className="workflow-admin__panel">
              <form className="workflow-admin__inline-form" onSubmit={(event) => submitMaster(event, "species-age-height", {
                state_id: masterForm.state_id || userScopeState,
                species_id: masterForm.species_id,
                age_id: masterForm.age_id,
                height_id: masterForm.height_id,
                remarks: masterForm.remarks || "",
              })}>
                {role === "national" && (
                  <label className="workflow-field"><span>{t("workflow.fields.state")}</span><select required value={masterForm.state_id || ""} onChange={(event) => setMasterForm((current) => ({ ...current, state_id: event.target.value }))}><option value="">{t("workflow.selectOption")}</option>{lookups.states.map((item) => <option key={item.state_id} value={item.state_id}>{item.state_name}</option>)}</select></label>
                )}
                <MasterSelect label={t("workflow.admin.speciesName")} value={masterForm.species_id} options={lookups.species} onChange={(value) => setMasterForm((current) => ({ ...current, species_id: value }))} t={t} />
                <MasterSelect label={t("workflow.admin.age")} value={masterForm.age_id} options={lookups.ages} onChange={(value) => setMasterForm((current) => ({ ...current, age_id: value }))} t={t} />
                <MasterSelect label={t("workflow.admin.height")} value={masterForm.height_id} options={lookups.heights} onChange={(value) => setMasterForm((current) => ({ ...current, height_id: value }))} t={t} />
                <label className="workflow-field"><span>{t("workflow.admin.remarks")}</span><input maxLength={250} value={masterForm.remarks || ""} onChange={(event) => setMasterForm((current) => ({ ...current, remarks: event.target.value }))} /></label>
                <button className="workflow-button" disabled={busy}>{t("workflow.admin.addSpeciesAgeHeight")}</button>
              </form>
              <div className="workflow-table-wrap">
                <table className="workflow-table workflow-admin__table">
                  <thead><tr>{[t("workflow.fields.state"), t("workflow.admin.speciesName"), t("workflow.admin.age"), t("workflow.admin.height"), t("workflow.admin.remarks"), t("workflow.directory.userStatus"), t("workflow.actions")].map((label) => <th key={label}>{label}</th>)}</tr></thead>
                  <tbody>{records.map((item) => <tr key={item.id}><td>{item.state_name || item.state_id}</td><td>{item.species_name || item.species_id}</td><td>{item.age_name || item.age_id}</td><td>{item.height_name || item.height_id}</td><td>{item.remarks || "—"}</td><td>{t(item.active === "Y" ? "workflow.directory.active" : "workflow.directory.inactive")}</td><td><button type="button" className="workflow-admin__action-button" onClick={() => toggleMaster("species-age-height", { SAH_ID: item.id, SAH_Active: item.active }, "SAH_ID", "SAH_Active")}>{t(item.active === "Y" ? "workflow.admin.deactivate" : "workflow.admin.activate")}</button></td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}

          {section === "directory" && (
            <section className="workflow-admin__panel">
              <header className="workflow-admin__heading"><div><h2>{t("workflow.admin.addDirectory")}</h2><p>{t("workflow.admin.directoryScope", { level: t(`workflow.admin.${directoryKind}`) })}</p></div></header>
              <form className="workflow-admin__inline-form" onSubmit={submitDirectory}>
                {directoryKind === "circle" && role === "national" && (
                  <label className="workflow-field"><span>{t("workflow.fields.state")}</span><select required value={form.state_id} onChange={(event) => { setField("state_id", event.target.value); updateDirectoryOptions({ state_id: event.target.value }); }}><option value="">{t("workflow.selectOption")}</option>{directory.states.map((item) => <option key={item.state_id} value={item.state_id}>{item.state_name}</option>)}</select></label>
                )}
                <label className="workflow-field"><span>{t("workflow.admin.directoryName")}</span><input required maxLength={255} value={masterForm.name || ""} onChange={(event) => setMasterForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <button className="workflow-button" disabled={busy}>{t("workflow.admin.addDirectory")}</button>
              </form>
              <div className="workflow-table-wrap">
                <table className="workflow-table workflow-admin__table">
                  <thead><tr><th>{t("workflow.admin.directoryName")}</th><th>{t("workflow.fields.state")}</th><th>{t("workflow.directory.userStatus")}</th><th>{t("workflow.actions")}</th></tr></thead>
                  <tbody>{records.map((item) => {
                    const idKey = directoryKind === "circle" ? "circle_id" : directoryKind === "division" ? "division_id" : "range_id";
                    const nameKey = directoryKind === "circle" ? "circle_name" : directoryKind === "division" ? "division_name" : "range_name";
                    const activeKey = directoryKind === "circle" ? "circle_active" : directoryKind === "division" ? "division_active" : "range_active";
                    return <tr key={item[idKey]}><td>{item[nameKey]}</td><td>{item.circle_state_id || "—"}</td><td>{t(item[activeKey] === "Y" ? "workflow.directory.active" : "workflow.directory.inactive")}</td><td><button type="button" className="workflow-admin__action-button" disabled={busy} onClick={() => api.patch("workflow/admin/directory/", { kind: directoryKind, id: item[idKey], active: item[activeKey] !== "Y" }).then(load).catch((requestError) => setError(requestError.message || t("workflow.saveError")))}>{t(item[activeKey] === "Y" ? "workflow.admin.deactivate" : "workflow.admin.activate")}</button></td></tr>;
                  })}</tbody>
                </table>
              </div>
              {role === "dfo" && (
                <section className="workflow-admin__panel">
                  <header className="workflow-admin__heading">
                    <div>
                      <h2>{t("workflow.fields.section")} / {t("workflow.fields.compartment")}</h2>
                      <p>{t("workflow.admin.directoryScope", { level: t("workflow.fields.range") })}</p>
                    </div>
                  </header>
                  <div className="workflow-admin__inline-form">
                    <label className="workflow-field">
                      <span>{t("workflow.fields.range")}</span>
                      <select
                        required
                        value={directoryRangeId}
                        onChange={(event) => selectDirectoryRange(event.target.value)}
                      >
                        <option value="">{t("workflow.selectOption")}</option>
                        {directory.ranges.filter((item) => item.range_active === "Y").map((item) => (
                          <option key={item.range_id} value={item.range_id}>{item.range_name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <form className="workflow-admin__inline-form" onSubmit={(event) => submitBeatDirectory(event, "section")}>
                    <label className="workflow-field">
                      <span>{t("workflow.fields.section")}</span>
                      <input
                        required
                        maxLength={255}
                        value={directoryEntryName}
                        onChange={(event) => setDirectoryEntryName(event.target.value)}
                      />
                    </label>
                    <button className="workflow-button" disabled={busy || !directoryRangeId}>
                      {t("workflow.admin.addDirectory")}
                    </button>
                  </form>
                  <div className="workflow-table-wrap">
                    <table className="workflow-table workflow-admin__table">
                      <thead><tr><th>{t("workflow.fields.section")}</th><th>{t("workflow.fields.range")}</th><th>{t("workflow.directory.userStatus")}</th><th>{t("workflow.actions")}</th></tr></thead>
                      <tbody>{directory.sections.map((item) => (
                        <tr key={item.section_id}>
                          <td>{item.section_name}</td>
                          <td>{directory.ranges.find((range) => range.range_id === item.section_range_id)?.range_name || "—"}</td>
                          <td>{t(item.section_active === "Y" ? "workflow.directory.active" : "workflow.directory.inactive")}</td>
                          <td>
                            <button
                              type="button"
                              className="workflow-admin__action-button"
                              disabled={busy}
                              onClick={() => toggleBeatDirectory("section", item, "section_id", "section_active")}
                            >
                              {t(item.section_active === "Y" ? "workflow.admin.deactivate" : "workflow.admin.activate")}
                            </button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="workflow-admin__inline-form">
                    <label className="workflow-field">
                      <span>{t("workflow.fields.section")}</span>
                      <select
                        required
                        value={directorySectionId}
                        onChange={(event) => selectDirectorySection(event.target.value)}
                      >
                        <option value="">{t("workflow.selectOption")}</option>
                        {directory.sections.filter((item) => item.section_active === "Y").map((item) => (
                          <option key={item.section_id} value={item.section_id}>{item.section_name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <form className="workflow-admin__inline-form" onSubmit={(event) => submitBeatDirectory(event, "compartment")}>
                    <label className="workflow-field">
                      <span>{t("workflow.fields.compartment")}</span>
                      <input
                        required
                        maxLength={255}
                        value={directoryEntryName}
                        onChange={(event) => setDirectoryEntryName(event.target.value)}
                      />
                    </label>
                    <button className="workflow-button" disabled={busy || !directorySectionId}>
                      {t("workflow.admin.addDirectory")}
                    </button>
                  </form>
                  <div className="workflow-table-wrap">
                    <table className="workflow-table workflow-admin__table">
                      <thead><tr><th>{t("workflow.fields.compartment")}</th><th>{t("workflow.fields.section")}</th><th>{t("workflow.directory.userStatus")}</th><th>{t("workflow.actions")}</th></tr></thead>
                      <tbody>{directory.compartments.map((item) => (
                        <tr key={item.compart_id}>
                          <td>{item.compart_name}</td>
                          <td>{directory.sections.find((beat) => beat.section_id === item.compart_section_id)?.section_name || "—"}</td>
                          <td>{t(item.compart_active === "Y" ? "workflow.directory.active" : "workflow.directory.inactive")}</td>
                          <td>
                            <button
                              type="button"
                              className="workflow-admin__action-button"
                              disabled={busy}
                              onClick={() => toggleBeatDirectory("compartment", item, "compart_id", "compart_active")}
                            >
                              {t(item.compart_active === "Y" ? "workflow.admin.deactivate" : "workflow.admin.activate")}
                            </button>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </section>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}

function MasterSelect({ label, value, options, onChange, t }) {
  return (
    <label className="workflow-field">
      <span>{label}</span>
      <select required value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">{t("workflow.selectOption")}</option>
        {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}

function MasterTable({ records, columns, labels, onToggle, t }) {
  const ids = {
    Designation_Code: "Designation_ID",
    Species_Name: "Species_ID",
  };
  const activeColumn = columns[columns.length - 1];
  return (
    <div className="workflow-table-wrap">
      <table className="workflow-table workflow-admin__table">
        <thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>{t("workflow.actions")}</th></tr></thead>
        <tbody>{records.map((item) => (
          <tr key={item[ids[columns[0]] || "Species_ID"] || item.Designation_ID}>
            {columns.map((column) => <td key={column}>{column === activeColumn ? t(item[column] === "Y" ? "workflow.directory.active" : "workflow.directory.inactive") : item[column] || "—"}</td>)}
            <td><button type="button" className="workflow-admin__action-button" onClick={() => onToggle(item)}>{t(item[activeColumn] === "Y" ? "workflow.admin.deactivate" : "workflow.admin.activate")}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function AdminPagination({ offset, count, length, loading, onPage, t }) {
  if (count <= PAGE_SIZE) return null;
  return (
    <footer className="workflow-directory__pagination">
      <span>{t("workflow.directory.pageSummary", {
        start: offset + 1,
        end: Math.min(offset + length, count),
        count,
      })}</span>
      <div>
        <button type="button" onClick={() => onPage(Math.max(0, offset - PAGE_SIZE))} disabled={loading || offset === 0}>
          {t("workflow.directory.previous")}
        </button>
        <button type="button" onClick={() => onPage(offset + PAGE_SIZE)} disabled={loading || offset + length >= count}>
          {t("workflow.directory.next")}
        </button>
      </div>
    </footer>
  );
}
