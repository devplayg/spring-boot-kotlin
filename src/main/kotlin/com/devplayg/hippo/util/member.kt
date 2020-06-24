package com.devplayg.hippo.util

import com.devplayg.hippo.framework.CustomUserDetails
import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder


fun getCurrentMember(): CustomUserDetails? {
    val auth: Authentication = SecurityContextHolder.getContext().authentication
    if (auth is AnonymousAuthenticationToken) {
        return null
    }
    val member: CustomUserDetails = auth.principal as CustomUserDetails
    return member
}