package com.devplayg.hippo.entity

import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable


// Table
object Members : IntIdTable("mbr_members", "member_id") {
    val name = varchar("name", 50).index()
    val age = integer("age")
}

// Entity
class Member(id: EntityID<Int>) : IntEntity(id) {
    companion object : IntEntityClass<Member>(Members)

    var name by Members.name
    var age by Members.age

    fun toDto() = MemberDto(
            id = this.id.value,
            age = this.age,
             name = this.name
    )
}

// DTO
data class MemberDto(
        val id: Int,
        val name: String,
        val age: Int
)