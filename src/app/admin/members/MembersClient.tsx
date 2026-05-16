"use client";

import { useState, useTransition, useRef, KeyboardEvent } from "react";
import { addMemberAction, bulkAddMembersAction, updateMemberAction } from "./actions";
import Papa from "papaparse";

type RelationalRole = {
  ministry_roles: { name: string };
};

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp_number: string | null;
  church_title: string | null;
  gender: string | null;
  birth_date: string | null;
  church_name?: string;
  roles?: string[];
  created_at: string;
};

// Helper to calculate age from birth_date
function calculateAge(birthDateString: string | null) {
  if (!birthDateString) return "?";
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const COMMON_TITLES = ["Pastor", "Reverend", "Elder", "Deacon", "Brother", "Sister"];

export default function MembersClient({ 
  initialMembers,
  existingChurches,
  existingRoles,
  existingEvents
}: { 
  initialMembers: Member[],
  existingChurches: string[],
  existingRoles: string[],
  existingEvents: { id: string; title: string; }[]
}) {
  const [members] = useState<Member[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // CSV State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isReviewingCsv, setIsReviewingCsv] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [selectedTitle, setSelectedTitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  
  const [churchInput, setChurchInput] = useState("");
  const [showChurchSuggestions, setShowChurchSuggestions] = useState(false);
  
  const [roleInput, setRoleInput] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setErrorMsg("");
    
    if (member.church_title) {
      if (COMMON_TITLES.includes(member.church_title)) {
        setSelectedTitle(member.church_title);
        setCustomTitle("");
      } else {
        setSelectedTitle("Other");
        setCustomTitle(member.church_title);
      }
    } else {
      setSelectedTitle("");
      setCustomTitle("");
    }
    
    setChurchInput(member.church_name || "");
    setSelectedRoles(member.roles || []);
    
    setIsManualFormOpen(true);
    setIsAddModalOpen(true);
  };

  // Filtering
  const filteredMembers = members.filter((member) => {
    const rolesStr = (member.roles || []).join(" ");
    return (
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rolesStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.church_name && member.church_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const churchSuggestions = existingChurches.filter(c => 
    c.toLowerCase().includes(churchInput.toLowerCase()) && c.toLowerCase() !== churchInput.toLowerCase()
  );

  const roleSuggestions = existingRoles.filter(r => 
    r.toLowerCase().includes(roleInput.toLowerCase()) && !selectedRoles.includes(r)
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setIsReviewingCsv(true);
      },
      error: (error) => {
        setErrorMsg("Failed to parse CSV file: " + error.message);
      }
    });
    
    e.target.value = '';
  };

  const handleCsvSubmit = async () => {
    setErrorMsg("");
    startTransition(async () => {
      const result = (await bulkAddMembersAction(csvData, selectedEventId || null)) as any;
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        window.location.reload(); // Refresh to get fresh relational data
      }
    });
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    
    // Inject complex UI states into formData
    const finalTitle = selectedTitle === "Other" ? customTitle : selectedTitle;
    formData.set("church_title", finalTitle);
    formData.set("origin_church", churchInput);
    formData.set("ministry_role", selectedRoles.join(","));
    
    startTransition(async () => {
      let result;
      if (editingMember) {
        formData.set("id", editingMember.id);
        result = await updateMemberAction(formData);
      } else {
        result = await addMemberAction(formData);
      }
      
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        window.location.reload(); // Refresh to get fresh relational data
      }
    });
  };

  const handleRoleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (roleInput.trim() && !selectedRoles.includes(roleInput.trim())) {
        setSelectedRoles([...selectedRoles, roleInput.trim()]);
      }
      setRoleInput("");
      setShowRoleSuggestions(false);
    } else if (e.key === 'Backspace' && roleInput === "" && selectedRoles.length > 0) {
      setSelectedRoles(selectedRoles.slice(0, -1));
    }
  };

  const removeRole = (role: string) => {
    setSelectedRoles(selectedRoles.filter(r => r !== role));
  };

  return (
    <>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline text-zinc-900 mb-2">Members Directory</h1>
          <p className="text-zinc-500 font-body">Manage the entire congregation CRM, filtering by roles and demographics.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              search
            </span>
            <input
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search members or roles..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setEditingMember(null);
              setSelectedTitle("");
              setCustomTitle("");
              setChurchInput("");
              setSelectedRoles([]);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Member
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] rounded-t-xl">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Member Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Contact Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Demographics</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Ministry Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                        <img
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.full_name.replace(/\s+/g, "")}`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {member.full_name}
                          {member.church_title && (
                            <span className="ml-2 text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {member.church_title}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">Joined {new Date(member.created_at).getFullYear()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-700 font-medium">{member.whatsapp_number || "No WA recorded"}</p>
                    <p className="text-xs text-zinc-500">{member.email || "No Email recorded"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-700">{member.gender || "U"}, {calculateAge(member.birth_date)} y.o.</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[150px]">{member.church_name || "No church listed"}</p>
                  </td>
                  <td className="px-6 py-4">
                    {member.roles && member.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(member.roles || []).map((role, idx) => (
                          <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setViewingMember(member)}
                      className="p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Profile"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button 
                      onClick={() => openEditModal(member)}
                      className="p-2 text-zinc-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors ml-1"
                      title="Edit Member"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-zinc-300">search_off</span>
                    <p>No members found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`bg-white rounded-2xl shadow-xl w-full ${isReviewingCsv ? "max-w-5xl" : "max-w-lg"} overflow-visible relative flex flex-col max-h-[90vh]`}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
              <h3 className="text-xl font-headline font-semibold text-zinc-900">
                {isReviewingCsv ? "Review CSV Data" : isManualFormOpen ? "Add Manually" : "Add New Member"}
              </h3>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsManualFormOpen(false);
                  setIsReviewingCsv(false);
                  setCsvData([]);
                  setSelectedEventId("");
                  setErrorMsg("");
                  setChurchInput("");
                  setSelectedRoles([]);
                }}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {errorMsg && !isManualFormOpen && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg mb-4 shrink-0">
                  {errorMsg}
                </div>
              )}

              {isReviewingCsv ? (
                <div className="space-y-4">
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left whitespace-nowrap text-xs">
                      <thead className="bg-zinc-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-semibold text-zinc-600">Full Name</th>
                          <th className="px-3 py-2 font-semibold text-zinc-600">Email</th>
                          <th className="px-3 py-2 font-semibold text-zinc-600">WhatsApp</th>
                          <th className="px-3 py-2 font-semibold text-zinc-600">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {csvData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{row.full_name || "-"}</td>
                            <td className="px-3 py-2 text-zinc-500">{row.email || "-"}</td>
                            <td className="px-3 py-2 text-zinc-500">{row.whatsapp_number || "-"}</td>
                            <td className="px-3 py-2 text-zinc-500">{row.ministry_role || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-zinc-500 text-center">
                    Found {csvData.length} member{csvData.length !== 1 ? 's' : ''} to import.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100">
                    <div className="w-full sm:w-auto">
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none text-zinc-700"
                      >
                        <option value="">No Event Link (CRM Only)</option>
                        {existingEvents.map(e => (
                          <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => {
                          setIsReviewingCsv(false);
                          setCsvData([]);
                          setSelectedEventId("");
                        }}
                        className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCsvSubmit}
                        disabled={isPending}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isPending ? "Importing..." : "Confirm & Import"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : !isManualFormOpen ? (
                <div className="space-y-6">
                  {/* Option 1: Upload CSV */}
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:bg-zinc-50 transition-colors group">
                    <div className="w-12 h-12 bg-purple-50 text-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">upload_file</span>
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-900 mb-1">Upload CSV File</h4>
                    <p className="text-xs text-zinc-500 mb-3">Bulk import members from a spreadsheet</p>
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        Select File
                      </button>
                      <a 
                        href="/members-template.csv" 
                        download
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Download CSV Template
                      </a>
                    </div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-100 flex-1"></div>
                    <span className="text-xs text-zinc-400 font-medium uppercase">or</span>
                    <div className="h-px bg-zinc-100 flex-1"></div>
                  </div>

                  {/* Option 2: Manually Add Form */}
                  <div>
                    <button 
                      className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      onClick={() => setIsManualFormOpen(true)}
                    >
                      <span className="material-symbols-outlined text-sm">edit_document</span>
                      Add Manually
                    </button>
                    <p className="text-xs text-center text-zinc-500 mt-2">Fill out a form for a single person</p>
                  </div>
                </div>
              ) : (
                <form key={editingMember?.id || 'new'} onSubmit={handleManualSubmit} className="space-y-5">
                  {errorMsg && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                      {errorMsg}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name *</label>
                    <input required name="full_name" type="text" defaultValue={editingMember?.full_name || ""} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. John Doe" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                      <input name="email" type="email" defaultValue={editingMember?.email || ""} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">WhatsApp</label>
                      <input name="whatsapp_number" type="text" defaultValue={editingMember?.whatsapp_number || ""} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="+62 812..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Gender</label>
                      <select name="gender" defaultValue={editingMember?.gender || ""} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Birth Date</label>
                      <input name="birth_date" type="date" defaultValue={editingMember?.birth_date || ""} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-4 rounded-xl space-y-4 border border-zinc-100">
                    <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Church & Ministry</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Church Title</label>
                        <select 
                          value={selectedTitle}
                          onChange={(e) => setSelectedTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none mb-2"
                        >
                          <option value="">None</option>
                          {COMMON_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="Other">Other (Custom)</option>
                        </select>
                        {selectedTitle === "Other" && (
                          <input 
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            type="text" 
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                            placeholder="Type custom title..." 
                          />
                        )}
                      </div>
                      
                      <div className="relative">
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Origin Church</label>
                        <input 
                          value={churchInput}
                          onChange={(e) => {
                            setChurchInput(e.target.value);
                            setShowChurchSuggestions(true);
                          }}
                          onFocus={() => setShowChurchSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowChurchSuggestions(false), 200)}
                          type="text" 
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                          placeholder="e.g. WoW Main Campus" 
                        />
                        {showChurchSuggestions && churchSuggestions.length > 0 && (
                          <ul className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                            {churchSuggestions.map(suggestion => (
                              <li 
                                key={suggestion}
                                className="px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                onClick={() => {
                                  setChurchInput(suggestion);
                                  setShowChurchSuggestions(false);
                                }}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Ministry Roles</label>
                      <div className="min-h-[42px] p-1.5 bg-white border border-zinc-200 rounded-lg flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-primary/20">
                        {selectedRoles.map(role => (
                          <span key={role} className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                            {role}
                            <button type="button" onClick={() => removeRole(role)} className="hover:text-purple-900">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}
                        <div className="relative flex-1 min-w-[120px]">
                          <input 
                            value={roleInput}
                            onChange={(e) => {
                              setRoleInput(e.target.value);
                              setShowRoleSuggestions(true);
                            }}
                            onKeyDown={handleRoleKeyDown}
                            onFocus={() => setShowRoleSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                            type="text" 
                            className="w-full outline-none text-sm bg-transparent" 
                            placeholder={selectedRoles.length === 0 ? "Type a role & press Enter..." : ""}
                          />
                          {showRoleSuggestions && roleSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-2 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {roleSuggestions.map(suggestion => (
                                <li 
                                  key={suggestion}
                                  className="px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                  onClick={() => {
                                    setSelectedRoles([...selectedRoles, suggestion]);
                                    setRoleInput("");
                                    setShowRoleSuggestions(false);
                                  }}
                                >
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">Press Enter or comma to add multiple tags.</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsManualFormOpen(false)}
                      className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isPending ? "Saving..." : "Save Member"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Slide-Over Modal */}
      {viewingMember && (
        <MemberProfileModal 
          member={viewingMember} 
          onClose={() => setViewingMember(null)} 
        />
      )}
    </>
  );
}

function MemberProfileModal({ member, onClose }: { member: Member, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header with Cover-like style */}
        <div className="bg-primary p-8 text-white relative shrink-0">
          <div className="absolute top-0 right-0 p-4">
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/30 shrink-0">
              <img
                alt={member.full_name}
                className="w-full h-full object-cover rounded-xl"
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.full_name.replace(/\s+/g, "")}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-headline font-bold">{member.full_name}</h3>
                {member.church_title && (
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/20">
                    {member.church_title}
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm font-medium">{member.church_name || "No church affiliated"}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(member.roles || []).map((role, idx) => (
                          <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {role}
                          </span>
                        ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-zinc-600">
                  <span className="material-symbols-outlined text-zinc-400">mail</span>
                  <span className="text-sm">{member.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600">
                  <span className="material-symbols-outlined text-zinc-400">chat</span>
                  <span className="text-sm">{member.whatsapp_number || "No WhatsApp"}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Demographics</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-zinc-600">
                  <span className="material-symbols-outlined text-zinc-400">person</span>
                  <span className="text-sm">{member.gender || "Unknown Gender"}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600">
                  <span className="material-symbols-outlined text-zinc-400">cake</span>
                  <span className="text-sm">
                    {member.birth_date ? new Date(member.birth_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "No birth date"} 
                    ({calculateAge(member.birth_date)} years old)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event History Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Event Participation History</h4>
              <span className="text-xs font-bold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">{0} Events</span>
            </div>
            
            {0 > 0 ? (
              <div className="space-y-3">
                {([].map)((at, idx) => {
                  const event = at.registration_orders.events;
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:bg-zinc-100/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">event_available</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{event.title}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase bg-white border border-zinc-200 px-2 py-1 rounded-lg">
                        Attended
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                <span className="material-symbols-outlined text-zinc-300 text-4xl mb-2">history</span>
                <p className="text-sm text-zinc-400">No event records found for this member.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
