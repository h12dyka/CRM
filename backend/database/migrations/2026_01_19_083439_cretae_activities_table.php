<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('activity_date');
            $table->time('activity_time');
            $table->string('client_name');
            $table->enum('activity_type', ['meeting', 'visit', 'call', 'presentation', 'demo', 'followup']);
            $table->enum('status', ['success', 'pending', 'followup', 'closed']);
            $table->string('location')->nullable();
            $table->string('contact_person')->nullable();
            $table->text('description');
            $table->string('deal_value')->nullable();
            $table->string('next_action')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
