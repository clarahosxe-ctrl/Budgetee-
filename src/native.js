import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar } from '@capacitor/status-bar';

window.Native = { isNative: Capacitor.isNativePlatform(), App, Filesystem, Share, StatusBar };
