import React from 'react';
import { MessageCircle, Mail, BarChart3, Database, Send, FileText, CheckCircle2 } from 'lucide-react';

export function Features() {
  return (
    <section className="py-24 bg-gray-50/50" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
            Der Workflow
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Alles fließt nahtlos ineinander
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Von der Erfassung bis zur Freigabe: Ein kognitiv müheloser Prozess, der Ihnen den Rücken freihält.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* 1. Eingang: Multi-Channel */}
          <div className="lg:col-span-7 group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-10">
            <div className="flex-1">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Multi-Channel Eingang</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                Empfangen Sie Belege und Rechnungen genau dort, wo Ihre Kunden ohnehin kommunizieren. Egal ob WhatsApp, Telegram oder E-Mail – alles landet zentral an einem Ort.
              </p>
            </div>
            {/* Minimalist illustration area */}
            <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100/50 flex items-center justify-center space-x-4">
              <div className="bg-white p-3 rounded-xl shadow-sm flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">WhatsApp</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm flex items-center space-x-2">
                <Send className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Telegram</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm flex items-center space-x-2">
                <Mail className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">E-Mail</span>
              </div>
            </div>
          </div>

          {/* 2. Konvertierung & Analyse */}
          <div className="lg:col-span-5 group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-10">
            <div className="flex-1">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Konvertierung & Analyse</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                Automatische ZUGFeRD-Konvertierung und smarte Datenanalyse im Dashboard. Erkennen Sie Trends auf einen Blick, ohne manuelle Dateneingabe.
              </p>
            </div>
            <div className="mt-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 flex flex-col gap-3">
              <div className="h-2 w-3/4 bg-blue-200 rounded-full"></div>
              <div className="h-2 w-1/2 bg-blue-200 rounded-full"></div>
              <div className="mt-4 flex items-end space-x-2">
                <div className="w-4 h-8 bg-blue-400 rounded-t-sm"></div>
                <div className="w-4 h-12 bg-blue-500 rounded-t-sm"></div>
                <div className="w-4 h-6 bg-blue-300 rounded-t-sm"></div>
                <div className="w-4 h-16 bg-indigo-500 rounded-t-sm"></div>
              </div>
            </div>
          </div>

          {/* 3. Archiv */}
          <div className="lg:col-span-5 group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-10">
            <div className="flex-1">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Sicheres Archiv</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                Ihre Dokumente werden revisionssicher und GoBD-konform gespeichert. Finden Sie jeden Beleg in Sekunden wieder, perfekt organisiert und geschützt.
              </p>
            </div>
            <div className="mt-10 flex items-center justify-center p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
               <div className="space-y-3 w-full">
                  <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div className="h-2 w-32 bg-gray-200 rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>

          {/* 4. Export & Freigabe */}
          <div className="lg:col-span-7 group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col p-10">
            <div className="flex-1">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">1-Klick-Export & Freigabe</h3>
              <p className="text-gray-500 text-lg leading-relaxed">
                Nach Ihrer Freigabe geht alles blitzschnell: Exportieren Sie Dokumente mit nur einem Klick direkt an Ihren Steuerberater oder teilen Sie diese via E-Mail mit Kunden.
              </p>
            </div>
            <div className="mt-10 p-6 bg-purple-50/30 rounded-2xl border border-purple-100/50 flex flex-col sm:flex-row items-center gap-4 justify-center">
              <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-purple-100 flex flex-col items-center gap-2">
                <FileText className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-500">Freigabe ausstehend</span>
              </div>
              <div className="text-purple-300 hidden sm:block">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="bg-purple-600 px-6 py-4 rounded-xl shadow-md text-white flex flex-col items-center gap-2 cursor-pointer hover:bg-purple-700 transition-colors">
                <Send className="h-6 w-6" />
                <span className="text-sm font-medium">An Steuerberater senden</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
