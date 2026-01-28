<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Activity extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'activity_date',
        'activity_time',
        'client_name',
        'activity_type',
        'status',
        'location',
        'contact_person',
        'description',
        'deal_value',
        'next_action',
        'attachments',
    ];

    protected $casts = [
        'attachments' => 'array',
        'activity_date' => 'date',
    ];

    protected $appends = [
        'formatted_date',
        'time_ago',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function getFormattedDateAttribute()
    {
        return $this->activity_date->format('F j, Y');
    }
    public function getTimeAgoAttribute()
    {
        $datetime = $this->activity_date->format('y-m-d') . ' ' . $this->activity_time;
        return $this->created_at->diffForHumans();
    }

    public function scopeToday($query)
    {
        return $query->whereDate('activity_date', now()->toDateString());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('activity_date', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('activity_date', now()->month)
                     ->whereYear('activity_date', now()->year);
    }
}
