import React, { useState } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { 
  Award, 
  BookOpen, 
  UserCog,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import LMSKursusBestuur from './LMSKursusBestuur';
import VBOBestuur from './VBOBestuur';

const ModeratorDashboard: React.FC = () => {
  const { currentUser, logout } = useNHKA();
  const [activeTab, setActiveTab] = useState<'vbo' | 'kursusse'>('vbo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#8B7CB3] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <UserCog className="w-5 h-5 md:w-6 md:h-6 text-[#8B7CB3]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold truncate">VBO Moderator</h1>
                <p className="text-white/80 text-sm md:text-base truncate">
                  Welkom, {currentUser.naam} {currentUser.van}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Teken Uit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[72px] md:top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('vbo')}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'vbo'
                  ? 'border-[#8B7CB3] text-[#8B7CB3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="hidden xs:inline">VBO Krediet</span> Indienings
            </button>
            <button
              onClick={() => setActiveTab('kursusse')}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'kursusse'
                  ? 'border-[#8B7CB3] text-[#8B7CB3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Kursus Bestuur
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {activeTab === 'vbo' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-[#8B7CB3]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">VBO Krediet Indienings</h2>
                <p className="text-sm text-gray-500">Hersien en keur predikante se VBO krediet indienings goed</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 overflow-hidden">
              <VBOBestuur />
            </div>
          </div>
        )}

        {activeTab === 'kursusse' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B7CB3]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[#8B7CB3]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">LMS Kursus Bestuur</h2>
                <p className="text-sm text-gray-500">Skep en bestuur VBO kursusse vir predikante</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 overflow-hidden">
              <LMSKursusBestuur />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ModeratorDashboard;
