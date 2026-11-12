---
layout: Post
title: Hockolic
description: An iPhone app for NHL fans and fantasy hockey players. Every team's salary cap and contracts, mock trades that tell you whether they'd really happen, and your own fantasy league. In public beta on TestFlight.
date: '2026-11-12'
# Listed on /current-projects, second
current: true
order: 2
tags:
  - swift
  - swiftui
  - spring-boot
  - payload-cms
logo:
  alt: iPhone
images:
  - src: /projects/hockolic/banner.jpg
    alt: Hockolic for iPhone
attributes:
  - label: Status
    value: Public beta on TestFlight
  - label: Platform
    value: iPhone
  - label: Role
    value: Design and development
  - label: Technology
    value: SwiftUI, Spring Boot, PostgreSQL, Payload CMS
---

Hockolic is a hockey app for people who follow the NHL closely and play in a fantasy league. It shows every team's
salary cap and contracts, lets you build mock trades between NHL teams and estimates whether they would really happen,
and runs your fantasy league with points counted game by game.

<Button href="https://testflight.apple.com/join/QWttPQvB" size="sm">Join the beta on TestFlight</Button>

---

### What's in the app

Five tabs: **Home**, **Teams**, **Players**, **Fantasy** and **Settings**, with search for teams and players at the
top of Home.

#### Home

Shortcuts to your mock trades and your fantasy team, and the league's salary cap at a glance: the average team's cap
hit against the cap and the floor, and whether every team is within them. Below that are up to three favorite teams,
each with its cap hit, its cap space (counting LTIR relief) and how full its cap is, and your favorite players with
their stats.

#### Teams

Every team by division, with its place in the league and its outlook: a contender, on the bubble or rebuilding, and a
buyer, neutral or a seller. A team's page has its salary cap, cap space and contracts, who is hurt, the draft picks it
owns in the next three drafts (its own and those it got in trades), and its players by position.

#### Players

The top forwards and defensemen by points, and the top goalies by wins. A player's page has his profile, cap hit,
contracts, this season's numbers and every season before. A player whose contract ends this season is tagged **UFA**
or **RFA**, since that changes what he's worth in a trade.

---

### Mock trades

Make up a trade between two or three NHL teams and see how it would work.

- **What each team sends:** players (with up to 50% of a player's salary retained), draft picks and future
  considerations.
- **Cap after the trade:** each team's cap hit, cap space and contracts, before and after.
- **Will it happen?** Every team values what it gets and gives in its own way: what a player brings on the ice, his
  age, his contract and cap hit, whether a pending free agent is just a rental, where a first-round pick would fall,
  and whether the team is contending or rebuilding. Each team gets a verdict, and the trade gets one of _Likely_,
  _Could happen_, _A stretch_, _Unlikely_ or _Not as it is_, with the reasons that weigh most.
- **Before it could happen:** what would stop it, such as a team going over the cap or the contract limit, retaining
  salary on more than three players, sending a pick it doesn't own, or a contender trading a key player.
- **Share it** as text, e.g. "Toronto Maple Leafs get: …".

Mock trades stay on your iPhone.

---

### Your fantasy league

- **Set up your league:** your team and the teams you play against, who manages each, and the players on every team.
  The standings rank them by total points, and a team opens its players, best first.
- **Points counted game by game,** from every player's games this season (see the scoring below).
- **Available players:** the top 100 forwards, defensemen or goalies who aren't on any team, each with how many more
  points he has than your weakest player at his position. Swipe to add one, or touch and hold to swap.
- **League trades:** trade one of your players for one on another team, or make it a three-way trade. The app
  suggests players with similar fantasy points and shows the points each team gives and gets. Accept a trade to make
  it.
- **Share your league** with a code that works for 30 days. A friend enters it, picks which team is theirs, and gets
  their own copy of the league.
- **With or without an account:** without one, the league stays on your iPhone. With one, it follows you to another
  iPhone, and every night the server adds each team's points for the day, so a traded player's points stay with the
  team he earned them for.

| Scoring                                 | Points                           |
| --------------------------------------- | -------------------------------- |
| Goal                                    | 1 (power play 2, short-handed 3) |
| Game-winning goal                       | 1 more                           |
| Assist                                  | 1 (on a short-handed goal 2)     |
| Hat trick                               | 5 more                           |
| Goalie win                              | 2 (shutout win 5)                |
| Goalie loss in overtime or the shootout | 1                                |

Goals in a shootout don't count, and when a team changes goalies during a game, neither goalie gets points.

---

### Daily game recap

Turn on the daily recap and, each morning at the hour you pick, one notification sums up the night before: your
favorite teams' results, your favorite players' points, wins and shutouts, and your fantasy team's points.

### Your account

Create an account with your email, or sign in with a passkey and Face ID. Two-step sign-in sends a code to your email,
Face ID can lock the app when it opens, and you can delete your account from the app. Hockolic also works without an
account.

---

### Built with

- **The iPhone app:** Swift, SwiftUI and SwiftData. Fantasy points, trade estimates and team outlooks are worked out
  on the phone.
- **The HockeyPoolCap API:** Spring Boot and PostgreSQL. It imports the NHL's standings, rosters, player pages and
  stats every day, keeps the accounts, adds up the fantasy points every night and sends the push notifications through
  Firebase.
- **Payload CMS:** the members' profiles and fantasy leagues, the push notifications, and screens to review and
  correct the NHL data. Contracts and trades are researched with AI and checked there by hand.

---

### Try the beta

You need an iPhone. Install [TestFlight](https://apps.apple.com/app/testflight/id899247664), then open the
invitation:

<Button href="https://testflight.apple.com/join/QWttPQvB" size="sm">Join the beta on TestFlight</Button>

_Hockolic is not affiliated with or endorsed by the NHL._
