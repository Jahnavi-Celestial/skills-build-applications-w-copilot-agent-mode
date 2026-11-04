import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('User, team, type, and minutes are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string' || !mongoose.isValidObjectId(userId) ||
    typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' || type.trim().length === 0 ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId).lean(), Team.findById(teamId).lean()]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members) ? members : [];
  if (memberIds.some((memberId) => typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  if (memberIds.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (memberCount !== memberIds.length) {
      throw Object.assign(new Error('One or more team members do not exist'), { status: 400 });
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);

  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? '',
      totalPoints: entry.totalPoints,
    }))
    .filter((entry) => entry.teamName)
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityTypes = new Set(recentActivities.map((activity) => String(activity.type).toLowerCase()));

  let focus = user.fitnessGoal?.toLowerCase();
  if (!focus && recentActivities.length > 0) {
    focus = String(recentActivities[0].type).toLowerCase();
  }

  const workouts = await Workout.find().lean();
  if (!focus) {
    return workouts.map((workout) => ({
      ...workout,
      reason: 'Suggested as a general activity for your recent workout history',
    }));
  }

  const matching = workouts.filter((workout) => String(workout.focus).toLowerCase() === focus);
  const candidates = matching.length > 0 ? matching : workouts;
  const ordered = candidates.map((workout) => {
    const recentTypeMatch = activityTypes.has(String(workout.focus).toLowerCase());
    const reason = recentTypeMatch
      ? `Matches your recent ${workout.focus} activity and fitness goal`
      : `Matches your ${user.fitnessGoal || focus} fitness goal or recent activity`;
    return { ...workout, reason };
  });

  return ordered;
}

export { User };
