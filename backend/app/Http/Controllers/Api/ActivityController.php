<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ActivityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Activity::with('user')
            ->where('user_id', $request->user()->id)
            ->orderBy('activity_date', 'desc')
            ->orderBy('activity_time', 'desc');

        // Filter by period
        if ($request->has('filter')) {
            switch ($request->filter) {
                case 'today':
                    $query->today();
                    break;
                case 'week':
                    $query->thisWeek();
                    break;
            }
        }

        $activities = $query->paginate(20);

        return response()->json($activities);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'activity_date' => 'required|date',
            'activity_time' => 'required',
            'client_name' => 'required|string|max:255',
            'activity_type' => 'required|in:meeting,visit,call,presentation,demo,followup',
            'status' => 'required|in:success,pending,followup,closed',
            'location' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'description' => 'required|string',
            'deal_value' => 'nullable|string|max:255',
            'next_action' => 'nullable|string|max:255',
            'attachments.*' => 'nullable|file|max:10240', // Max 10MB per file
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('attachments');
        $data['user_id'] = $request->user()->id;

        // Handle file uploads
        if ($request->hasFile('attachments')) {
            $attachmentPaths = [];
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('activity-attachments', 'public');
                $attachmentPaths[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => Storage::url($path),
                ];
            }
            $data['attachments'] = $attachmentPaths;
        }

        $activity = Activity::create($data);

        return response()->json([
            'message' => 'Activity created successfully',
            'data' => $activity->load('user')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Activity $activity)
    {
        // Check if user owns this activity
        if ($activity->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json($activity->load('user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Activity $activity)
    {
        // Check if user owns this activity
        if ($activity->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'activity_date' => 'sometimes|required|date',
            'activity_time' => 'sometimes|required',
            'client_name' => 'sometimes|required|string|max:255',
            'activity_type' => 'sometimes|required|in:meeting,visit,call,presentation,demo,followup',
            'status' => 'sometimes|required|in:success,pending,followup,closed',
            'location' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'description' => 'sometimes|required|string',
            'deal_value' => 'nullable|string|max:255',
            'next_action' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $activity->update($request->all());

        return response()->json([
            'message' => 'Activity updated successfully',
            'data' => $activity->load('user')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Activity $activity)
    {
        // Check if user owns this activity
        if ($activity->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $activity->delete();

        return response()->json([
            'message' => 'Activity deleted successfully'
        ]);
    }

    /**
     * Get statistics for the dashboard
     */
    public function statistics(Request $request)
    {
        $userId = $request->user()->id;

        $stats = [
            'today' => Activity::where('user_id', $userId)->today()->count(),
            'week' => Activity::where('user_id', $userId)->thisWeek()->count(),
            'month' => Activity::where('user_id', $userId)->thisMonth()->count(),
            'followup_pending' => Activity::where('user_id', $userId)
                ->where('status', 'followup')
                ->count(),
            'clients_visited' => Activity::where('user_id', $userId)
                ->thisMonth()
                ->distinct('client_name')
                ->count('client_name'),
            'total_deal_value' => Activity::where('user_id', $userId)
                ->thisMonth()
                ->where('status', 'closed')
                ->whereNotNull('deal_value')
                ->count(),
        ];

        return response()->json(['data' => $stats]);
    }
}