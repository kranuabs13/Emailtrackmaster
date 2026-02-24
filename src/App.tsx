/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, Mail, ShieldCheck, Zap, Terminal } from 'lucide-react';

export default function App() {
  const appUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#58a6ff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">EmailTrackMaster</h1>
              <p className="text-[#8b949e] text-sm">Outlook Add-in Production Server</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#238636]/10 border border-[#238636]/30 rounded-full">
            <div className="w-2 h-2 bg-[#238636] rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#238636] uppercase tracking-wider">Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl">
            <Zap className="w-6 h-6 text-[#d29922] mb-4" />
            <h3 className="text-white font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-sm text-[#8b949e]">Automatic logging of email opens and response times via Supabase.</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-[#3fb950] mb-4" />
            <h3 className="text-white font-semibold mb-2">Attachment Guard</h3>
            <p className="text-sm text-[#8b949e]">Smart detection of missing attachments before emails are sent.</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl">
            <Terminal className="w-6 h-6 text-[#bc8cff] mb-4" />
            <h3 className="text-white font-semibold mb-2">Event-Based</h3>
            <p className="text-sm text-[#8b949e]">Powered by Office.js ItemSend and ItemChanged events.</p>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-10">
            <h2 className="text-xl font-bold text-white mb-8">Deployment & Sideloading</h2>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#30363d] flex items-center justify-center text-white font-bold border border-[#484f58]">1</div>
                <div className="flex-grow">
                  <p className="text-white font-medium mb-2">Manifest URL</p>
                  <div className="relative group">
                    <code className="block bg-[#0d1117] p-4 rounded-xl text-sm text-[#58a6ff] break-all border border-[#30363d] font-mono">
                      {appUrl}/manifest.xml
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#30363d] flex items-center justify-center text-white font-bold border border-[#484f58]">2</div>
                <div>
                  <p className="text-white font-medium mb-2">Sideload in Outlook</p>
                  <ol className="text-sm text-[#8b949e] space-y-2 list-decimal list-inside">
                    <li>Open Outlook on the web or New Outlook.</li>
                    <li>Click <strong>Get Add-ins</strong> (or the Apps icon).</li>
                    <li>Select <strong>My add-ins</strong> &gt; <strong>Add a custom add-in</strong>.</li>
                    <li>Choose <strong>Add from URL</strong> and paste the link above.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1117] px-10 py-6 flex justify-between items-center border-t border-[#30363d]">
            <div className="flex items-center gap-4">
              <a href="/taskpane.html" className="text-xs font-semibold text-[#8b949e] hover:text-white transition-colors">Taskpane Preview</a>
              <span className="w-1 h-1 bg-[#30363d] rounded-full" />
              <a href="/manifest.xml" className="text-xs font-semibold text-[#8b949e] hover:text-white transition-colors">View XML</a>
            </div>
            <a 
              href="https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/sideload-outlook-add-ins-for-testing" 
              target="_blank" 
              className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline"
            >
              Documentation <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <footer className="mt-16 text-center">
          <p className="text-[#8b949e] text-xs">
            Built with pure JavaScript & Office.js &bull; Production Ready Structure
          </p>
        </footer>
      </div>
    </div>
  );
}
