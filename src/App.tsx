/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, Mail, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const appUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Mail className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">EmailTrackMaster</h1>
            <p className="text-zinc-400">Outlook Add-in Deployment Server</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Zap className="w-5 h-5" />
              <h2 className="font-semibold">Add-in Status</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The add-in manifest and taskpane are being served correctly. You can now sideload this add-in into your Outlook client.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-semibold">Supabase Ready</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Integration with Supabase is configured for real-time tracking of email response times and VIP SLAs.
            </p>
          </div>
        </div>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-bold mb-6">Sideloading Instructions</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium mb-1">Copy Manifest URL</p>
                  <code className="block bg-black p-3 rounded-lg text-xs text-blue-400 break-all border border-zinc-800">
                    {appUrl}/manifest.xml
                  </code>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium mb-1">Open Outlook Web</p>
                  <p className="text-sm text-zinc-400">Go to Outlook on the web or the New Outlook for Windows.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium mb-1">Add Custom Add-in</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Go to <strong>Get Add-ins</strong> &gt; <strong>My add-ins</strong> &gt; <strong>Add a custom add-in</strong> &gt; <strong>Add from URL</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/30 p-6 flex justify-between items-center border-t border-zinc-800">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Ready for Production</span>
            <a 
              href={`${appUrl}/manifest.xml`} 
              target="_blank" 
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Manifest <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        <footer className="mt-12 text-center text-zinc-600 text-xs">
          &copy; 2024 EmailTrackMaster &bull; Built with Office.js & Supabase
        </footer>
      </div>
    </div>
  );
}
