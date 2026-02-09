<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/



// Route::middleware('auth:sanctum')->group(function () {
//     Route::post('/auth/logout', [AuthController::class, 'logout']);
//     Route::get('/auth/profile', [AuthController::class, 'profile']);
//     Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
//     Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    
//     // Activity routes
//     Route::apiResource('activities', ActivityController::class);
//     Route::get('/activities/statistics', [ActivityController::class, 'statistics']);
// });


Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/activities/statistics', [ActivityController::class, 'statistics']);
    Route::apiResource('activities', ActivityController::class);
});

// Admin only
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/activities', [AdminController::class, 'activities']);
    Route::get('/statistics', [AdminController::class, 'statistics']);
    Route::put('/users/{user}/toggle-status', [AdminController::class, 'toggleUserStatus']);
});

