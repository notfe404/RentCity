import { useState, useRef, useEffect } from 'react';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Save, Upload, X, FileText, Check, Edit3 } from 'lucide-react';
import CustomerSidebar from '@/components/layout/CustomerSidebar';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getMe } from '@/services/userApi';
import { uploadDocument } from '@/services/userApi';
import { updateProfile } from '@/services/userApi';
import { getMyDocuments } from '@/services/userApi';

export default function ProfilePage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Local state for displaying & editing
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [street, setStreet] = useState('123 Main St, Apt 4B');
  const [city, setCity] = useState('New York');
  const [postal, setPostal] = useState('10001');

  // CCCD States
  const [frontId, setFrontId] = useState<{
  file?: File;
  url: string;
  isPdf: boolean;
} | null>(null);

const [backId, setBackId] = useState<{
  file?: File;
  url: string;
  isPdf: boolean;
} | null>(null);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Sync with auth cache
  useEffect(() => {
  const fetchUser = async () => {
    try {
      const { data } = await getMe();

      const parts = data.fullName.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(data.email);
      setPhone(data.phone || '');

      // 👉 GET DOCUMENTS
      const docRes = await getMyDocuments();
      setDocuments(docRes.data);

      if (docRes.data.length > 0) {
        const doc = docRes.data[0];

        setFrontId({
          url: doc.frontUrl,
          isPdf: doc.frontUrl.endsWith('.pdf'),
        });

        setBackId({
          url: doc.backUrl,
          isPdf: doc.backUrl.endsWith('.pdf'),
        });
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to load user data');
    }
  };

  fetchUser();
}, []);

  const handleFileUpload = (type: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('File too large');
    return;
  }

  const isPdf = file.type === 'application/pdf';
  const url = URL.createObjectURL(file);

  if (type === 'front') {
    setFrontId({ file, url, isPdf });
  } else {
    setBackId({ file, url, isPdf });
  }
};

  const removeFile = (type: 'front' | 'back', e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'front') {
      if (frontId) URL.revokeObjectURL(frontId.url);
      setFrontId(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else {
      if (backId) URL.revokeObjectURL(backId.url);
      setBackId(null);
      if (backInputRef.current) backInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
  try {
    // Update profile
    await updateProfile({
      fullName: `${firstName} ${lastName}`,
      phone,
    });

    // Upload ONLY if new files selected
    if (frontId?.file && backId?.file) {
      const formData = new FormData();

      formData.append('docType', 'CCCD');
      formData.append('docNumber', '123456789');
      formData.append('frontFile', frontId.file);
      formData.append('backFile', backId.file);

      await uploadDocument(formData);

      // reload docs
      const docRes = await getMyDocuments();
      setDocuments(docRes.data);

      const doc = docRes.data[0];

      setFrontId({
        url: doc.frontUrl,
        isPdf: doc.frontUrl.includes('.pdf'),
      });

      setBackId({
        url: doc.backUrl,
        isPdf: doc.backUrl.includes('.pdf'),
      });
    }

    toast.success('Profile updated & document uploaded!');
    setIsEditing(false);

  } catch (err) {
    console.error(err);
    toast.error('Failed to save profile');
  }
};

  const handleCancel = () => {
    // Reset or ignore
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-10">
        
        <CustomerSidebar />
        
        <div className="flex-1 space-y-8 animate-in fade-in duration-500 relative">
          
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 transition-all">
            {/* Header: Personal Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">Manage your personal details and contact info.</p>
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-[#f4f8f7] text-[#78ad44] hover:bg-[#eaf1e8] px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">First Name</label>
                {isEditing ? (
                   <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-900 font-bold" />
                ) : (
                   <div className="text-lg font-black text-gray-900">{firstName || '-'}</div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Last Name</label>
                {isEditing ? (
                   <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-900 font-bold" />
                ) : (
                   <div className="text-lg font-black text-gray-900">{lastName || '-'}</div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email Address</label>
                {isEditing ? (
                   <input type="email" value={email} disabled className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm text-gray-400 font-bold cursor-not-allowed" />
                ) : (
                   <div className="text-lg font-black text-gray-900">{email || '-'}</div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Phone Number</label>
                {isEditing ? (
                   <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-900 font-bold" />
                ) : (
                   <div className="text-lg font-black text-gray-900">{phone || '-'}</div>
                )}
              </div>
            </div>

            {/* Header: Address */}
            <div className="border-b border-gray-100 pb-5 mb-8">
              <h2 className="text-2xl font-black text-gray-900">Address</h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Your primary billing and residential address.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Street Address</label>
                {isEditing ? (
                  <input type="text" value={street} onChange={e=>setStreet(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-900 font-bold" />
                ) : (
                  <div className="text-lg font-black text-gray-900">{street || '-'}</div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">City</label>
                {isEditing ? (
                  <input type="text" value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-900 font-bold" />
                ) : (
                  <div className="text-lg font-black text-gray-900">{city || '-'}</div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Postal Code</label>
                {isEditing ? (
                   <input type="text" value={postal} onChange={e=>setPostal(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-900 font-bold" />
                ) : (
                   <div className="text-lg font-black text-gray-900">{postal || '-'}</div>
                )}
              </div>
            </div>

            {/* Header: Identity */}
            <div className="border-b border-gray-100 pb-5 mb-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                Identity Documents (CCCD) 
                {!isEditing && (frontId && backId) && <span className="bg-[#e9f2eb] text-[#78ad44] text-[10px] uppercase px-2 py-1 rounded-md ml-2 flex items-center gap-1"><Check size={12}/> Verified</span>}
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Valid government-issued ID required for rentals.</p>
            </div>
            
            {/* View Mode ID display vs Edit Mode ID upload */}
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
                  {frontId ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm shrink-0 border border-gray-200 flex items-center justify-center">
                       {frontId.isPdf ? <FileText className="text-red-500" size={24}/> : <img src={frontId.url} alt="ID" className="w-full h-full object-cover" />}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 border border-gray-300 shrink-0 flex items-center justify-center text-gray-400 font-bold text-xs text-center border-dashed">No Image</div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900">Front of ID</h4>
                    <p className="text-xs text-gray-500 font-medium">{frontId ? 'Uploaded successfully' : 'Missing document'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
                  {backId ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm shrink-0 border border-gray-200 flex items-center justify-center">
                       {backId.isPdf ? <FileText className="text-red-500" size={24}/> : <img src={backId.url} alt="ID" className="w-full h-full object-cover" />}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 border border-gray-300 shrink-0 flex items-center justify-center text-gray-400 font-bold text-xs text-center border-dashed">No Image</div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900">Back of ID</h4>
                    <p className="text-xs text-gray-500 font-medium">{backId ? 'Uploaded successfully' : 'Missing document'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front ID Upload */}
                <input type="file" accept="image/*,application/pdf" className="hidden" ref={frontInputRef} onChange={(e) => handleFileUpload('front', e)} />
                <div onClick={() => frontInputRef.current?.click()} className="relative border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-[#78ad44] hover:bg-[#f9fae8] transition-all cursor-pointer group bg-white overflow-hidden min-h-[200px]">
                  {frontId ? (
                    <>
                      <button onClick={(e) => removeFile('front', e)} className="absolute top-4 right-4 bg-white/80 backdrop-blur text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors z-10 shadow-sm">
                        <X size={16} strokeWidth={3} />
                      </button>
                      {frontId.isPdf ? (
                        <div className="flex flex-col items-center"><FileText size={48} className="text-red-500 mb-2"/><span className="font-bold text-gray-800">PDF Document Selected</span></div>
                      ) : (
                        <img src={frontId.url} alt="Front ID Preview" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white shadow-sm transition-all">
                        <Upload size={24} className="text-gray-400 group-hover:text-[#78ad44]" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">Upload Front of ID</h4>
                      <p className="text-xs text-gray-400 font-medium px-4">JPEG, PNG or PDF (Max 5MB)</p>
                    </>
                  )}
                </div>

                {/* Back ID Upload */}
                <input type="file" accept="image/*,application/pdf" className="hidden" ref={backInputRef} onChange={(e) => handleFileUpload('back', e)} />
                <div onClick={() => backInputRef.current?.click()} className="relative border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-[#78ad44] hover:bg-[#f9fae8] transition-all cursor-pointer group bg-white overflow-hidden min-h-[200px]">
                  {backId ? (
                    <>
                      <button onClick={(e) => removeFile('back', e)} className="absolute top-4 right-4 bg-white/80 backdrop-blur text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors z-10 shadow-sm">
                        <X size={16} strokeWidth={3} />
                      </button>
                      {backId.isPdf ? (
                        <div className="flex flex-col items-center"><FileText size={48} className="text-red-500 mb-2"/><span className="font-bold text-gray-800">PDF Document Selected</span></div>
                      ) : (
                        <img src={backId.url} alt="Back ID Preview" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white shadow-sm transition-all">
                        <Upload size={24} className="text-gray-400 group-hover:text-[#78ad44]" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">Upload Back of ID</h4>
                      <p className="text-xs text-gray-400 font-medium px-4">JPEG, PNG or PDF (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons (Edit Mode Only) */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={handleCancel}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-[#212529] hover:bg-[#111] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
