package com.waad.tba.modules.eligibility.domain.rules;

import com.waad.tba.modules.eligibility.domain.*;
import com.waad.tba.modules.provider.repository.ProviderAllowedEmployerRepository;
import com.waad.tba.modules.providercontract.entity.ProviderContract.ContractStatus;
import com.waad.tba.modules.providercontract.repository.ProviderContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Rule: Provider Network Scope (TPA Model)
 * Ensures the provider is authorized to serve the member's employer/payer.
 * 
 * Logic:
 * 1. Provider MUST have an active contract with Waad TPA (provider_contracts).
 * 2. Member's employer MUST be in the Allowed Employers list (provider_allowed_employers).
 */
@Component
@Order(20) // Early check
@Slf4j
@RequiredArgsConstructor
public class ProviderNetworkScopeRule implements EligibilityRule {

    private final ProviderContractRepository providerContractRepository;
    private final ProviderAllowedEmployerRepository allowedEmployerRepository;

    @Override
    public String getRuleCode() {
        return "PROVIDER_NETWORK_SCOPE";
    }

    @Override
    public String getNameAr() {
        return "نطاق شبكة مقدم الخدمة";
    }

    @Override
    public int getPriority() {
        return 20;
    }

    @Override
    public boolean isHardRule() {
        return true;
    }

    @Override
    public boolean isApplicable(EligibilityContext context) {
        // Only applicable if we have a provider and a member with an employer
        return context.getProvider() != null && context.getEmployerOrganization() != null;
    }

    @Override
    public RuleResult evaluate(EligibilityContext context) {
        Long providerId = context.getProviderId();
        Long memberEmployerId = context.getEmployerOrganization().getId(); // Assuming employerOrganization is the payer
        String employerName = context.getEmployerOrganization().getName();

        // 1. Check for ANY active contract (The TPA Contract)
        boolean hasActiveContract = providerContractRepository
                .existsByProviderIdAndStatusAndActiveTrue(providerId, ContractStatus.ACTIVE);

        if (!hasActiveContract) {
            return RuleResult.fail(
                    EligibilityReason.PROVIDER_NOT_IN_NETWORK,
                    "No active contract found for this provider",
                    "عذراً، لا يوجد عقد ساري المفعول مع شركة وعد"
            );
        }

        // 2. Check Allowed Employers List
        boolean isEmployerAllowed = allowedEmployerRepository
                .existsByProviderIdAndEmployerIdAndActiveTrue(providerId, memberEmployerId);

        if (isEmployerAllowed) {
            return RuleResult.pass();
        }

        return RuleResult.fail(
                EligibilityReason.MEMBER_NOT_IN_SCOPE,
                "Employer " + memberEmployerId + " not allowed for provider " + providerId,
                "عذراً، جهة العمل (" + employerName + ") غير مشمولة في شبكة مقدم الخدمة هذا"
        );
    }
}
