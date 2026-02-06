package com.waad.tba.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Base entity for Soft Delete support and Auditing.
 * 
 * Features:
 * 1. Soft Delete: via 'active' flag.
 * 2. Auditing: createdAt, updatedAt automated maintenance.
 * 
 * Usage:
 * Extend this class and add @SQLDelete(sql = "UPDATE table_name SET active = false WHERE id = ?") 
 * and @Where(clause = "active = true") to the subclass.
 */
@MappedSuperclass
@Getter
@Setter
@lombok.experimental.SuperBuilder
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public abstract class SoftDeleteEntity {

    /**
     * Soft delete flag (Active = true, Deleted = false)
     */
    @Column(nullable = false)
    protected boolean active = true;

    /**
     * Audit: creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    protected LocalDateTime createdAt;

    /**
     * Audit: last update timestamp
     */
    @Column(name = "updated_at", nullable = false)
    protected LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
