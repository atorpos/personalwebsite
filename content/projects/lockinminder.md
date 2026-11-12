---
layout: Post
title: LockinMinder
description: Remembers the combinations of your combination locks and where you left each padlock, on Apple Watch, iPhone and iPad. In public beta on TestFlight.
date: '2026-11-12'
# Listed on /current-projects, first
current: true
order: 1
tags:
  - swift
  - swiftui
  - watchos
  - cloudkit
logo:
  alt: Apple Watch · iPhone · iPad
images:
  - src: /projects/lockinminder/banner.jpg
    alt: LockinMinder for Apple Watch, iPhone and iPad
attributes:
  - label: Status
    value: Public beta on TestFlight
  - label: Platforms
    value: Apple Watch, iPhone, iPad
  - label: Role
    value: Design and development
  - label: Technology
    value: Swift, SwiftUI, SwiftData, CloudKit
---

LockinMinder remembers the combinations of your combination locks, and where you left each padlock. Check a
combination on your wrist at the gym locker, tap **Mark as Locked** at the bike rack, and find your way back to it
later on a map. It runs on Apple Watch, iPhone and iPad, and keeps them in sync through your own iCloud account.

<Button href="https://testflight.apple.com/join/PSfs8fSa" size="sm">Join the beta on TestFlight</Button>

---

### What it does

- **Keeps your combinations.** Each lock has a name and a combination of 3, 4 or 5 numbers from 0 to 99, so both
  wheel locks and dial padlocks fit.
- **Shows them on your wrist.** Open a lock on Apple Watch and its combination appears in large numbers, one tile per
  wheel.
- **Remembers where you locked it.** **Mark as Locked** saves the time and where you are. The lock's screen then shows
  a map with a pin, and the iPhone app offers walking directions in Apple Maps.
- **Puts it on your Lock Screen.** While a lock is locked, a Live Activity on the iPhone Lock Screen, in the Dynamic
  Island and in the Apple Watch Smart Stack shows how long it has been locked. It never shows the combination.
- **Syncs your devices.** Add, edit or delete a lock on either device. Changes sync through iCloud, and **Sync Now**
  checks on demand.
- **Speaks your language.** English, Spanish, French and Traditional Chinese.

---

### Add a lock

![Adding a lock on Apple Watch: a name and how many numbers, then one wheel per number (design mockup)](/projects/lockinminder/flow-1-add-lock.png)

On Apple Watch, adding a lock takes two steps so the wheels get a whole screen: a name and how many numbers, then one
0–99 wheel per number, like the dials on the real lock. Tap a wheel and turn the Digital Crown to set it. Leave the
name blank and it becomes "Lock 1", "Lock 2" and so on. On iPhone and iPad, it's a single form.

### Check a combination at the lock

![The list, a lock's combination, and the digits hidden when the wrist is lowered (design mockup)](/projects/lockinminder/flow-2-check-combination.png)

The list shows only names and whether each lock is locked, so nobody nearby can read a combination from it. The digits
appear when you open a lock, and turn into dots as soon as you lower your wrist.

### Find your padlock again

![Mark as Locked, the location permission asked once, the map on the lock's screen, and the full map (design mockup)](/projects/lockinminder/flow-3-save-location.png)

After snapping the padlock shut, tap **Mark as Locked**. The device takes one location fix and saves it with the time.
Later, the lock's screen shows where it is and how accurate the spot is ("Within 40 ft"), and the map shows the lock
and you together. If location is off, the lock is still marked as locked, with the time.

---

### Private by design

- **The app locks itself.** iPhone and iPad open with Face ID, Touch ID or a 6-digit app passcode. Apple Watch opens
  only while it's unlocked on your wrist.
- **Combinations stay out of sight.** A combination is shown only on its lock's own screen, never in the list, and it
  is hidden on the dimmed Always On display and in the iPhone app switcher.
- **Your data is yours.** Locks are kept in your private iCloud database, with the name, combination and location
  end-to-end encrypted. LockinMinder has no server of its own.
- **No tracking.** A location is saved only when you tap **Mark as Locked**. With Pro, the iPhone follows your location
  only while a lock's Live Activity is showing, to update the distance back to it.

![Apple Watch and iPhone both sync with your private iCloud database](/projects/lockinminder/icloud-sync.png)

---

### Free and Pro

Up to three locks are free. **Pro** is a one-time purchase, not a subscription, and it unlocks on every device signed
in to the same Apple Account.

|                                                  | Free                          | Pro                              |
| ------------------------------------------------ | ----------------------------- | -------------------------------- |
| Saved locks                                      | Up to 3                       | Unlimited                        |
| Combinations, map and walking directions         | Yes                           | Yes                              |
| iCloud sync between Apple Watch, iPhone and iPad | Yes                           | Yes                              |
| Live Activity                                    | Name and how long it's locked | Adds live distance and direction |

With Pro, the Live Activity shows the distance and a compass arrow back to the lock, updated while you walk. iCloud
sync stays free, and locks you've already saved are never hidden or deleted.

---

### Built with

- **Swift and SwiftUI** for watchOS and iOS, with the Digital Crown setting the wheels
- **SwiftData** mirrored to the user's private **CloudKit** database, with end-to-end encrypted fields
- **ActivityKit and WidgetKit** for the Live Activity on the Lock Screen, in the Dynamic Island and in the Smart Stack
- **MapKit and Core Location** for the saved spot, the map and the distance and direction back to it
- **LocalAuthentication and the Keychain** for the app lock
- **StoreKit 2** for the one-time Pro purchase, checked on the device

---

### Try the beta

You need an iPhone with iOS 18 or later. For the watch app, an Apple Watch with watchOS 27. Install
[TestFlight](https://apps.apple.com/app/testflight/id899247664), then open the invitation:

<Button href="https://testflight.apple.com/join/PSfs8fSa" size="sm">Join the beta on TestFlight</Button>
